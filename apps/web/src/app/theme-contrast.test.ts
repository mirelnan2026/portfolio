import { readFileSync } from "node:fs";
import { join } from "node:path";
import { converter, wcagContrast } from "culori";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(import.meta.dirname, "globals.css"), "utf8");

/** The `--name: value;` declarations inside the first `selector { … }` block of globals.css. */
function tokensOf(selector: string): Map<string, string> {
  const start = css.indexOf(`${selector} {`);
  const body = css.slice(start, css.indexOf("}", start));
  return new Map(
    [...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name = "", value = ""]) => [
      name,
      value.trim(),
    ]),
  );
}

const light = tokensOf(":root");
// Dark overrides the colours only, so anything it leaves out keeps its light value.
const dark = new Map([...light, ...tokensOf(".dark")]);

const toRgb = converter("rgb");

/** WCAG contrast of `fg` drawn on `bg`; a translucent `fg` is blended over `bg` first, as the browser does. */
function contrast(fg: string, bg: string): number {
  const front = toRgb(fg);
  const back = toRgb(bg);
  if (!front || !back) throw new Error(`Not a colour: ${fg} or ${bg}`);
  const alpha = front.alpha ?? 1;
  const mix = (f: number, b: number) => f * alpha + b * (1 - alpha);
  return wcagContrast(
    { mode: "rgb", r: mix(front.r, back.r), g: mix(front.g, back.g), b: mix(front.b, back.b) },
    back,
  );
}

// Text needs 4.5:1 (1.4.3); focus rings and input borders need 3:1 against what is next to them (1.4.11).
const text = 4.5;
const nonText = 3;
const pairs: [foreground: string, background: string, minimum: number][] = [
  ["foreground", "background", text],
  ["card-foreground", "card", text],
  ["popover-foreground", "popover", text],
  ["primary-foreground", "primary", text],
  ["secondary-foreground", "secondary", text],
  ["accent-foreground", "accent", text],
  ["muted-foreground", "background", text],
  ["muted-foreground", "muted", text],
  ["muted-foreground", "card", text],
  ["destructive", "background", text],
  ["ring", "background", nonText],
  ["ring", "card", nonText],
  ["input", "background", nonText],
  ["input", "card", nonText],
  ["brand", "background", text],
  ["brand", "brand-soft", text],
  ["brand", "muted", text],
  ["brand", "card", text],
];

describe.each([
  ["light", light],
  ["dark", dark],
])("%s theme", (_theme, tokens) => {
  it.each(pairs)("%s on %s reaches %d:1", (foreground, background, minimum) => {
    const fg = tokens.get(foreground);
    const bg = tokens.get(background);
    expect(fg, `--${foreground} is defined`).toBeDefined();
    expect(bg, `--${background} is defined`).toBeDefined();
    expect(contrast(fg ?? "", bg ?? "")).toBeGreaterThanOrEqual(minimum);
  });
});
