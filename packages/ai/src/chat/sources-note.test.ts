import { describe, expect, it } from "vitest";
import { withSourcesNote, withoutSourcesTags } from "./sources-note";

describe("withSourcesNote", () => {
  it("ends an earlier answer with the tools it was written from", () => {
    expect(withSourcesNote("Mirel is based in Bucharest.", ["search_cv", "get_profile"])).toBe(
      "Mirel is based in Bucharest.\n<sources>search_cv, get_profile</sources>",
    );
  });

  it("leaves an answer written without tools as it is", () => {
    expect(withSourcesNote("not in the CV.", [])).toBe("not in the CV.");
  });
});

describe("withoutSourcesTags", () => {
  it.each([
    [
      "an opening and a closing tag",
      "Mirel was CTO.<sources>get_profile</sources>",
      "Mirel was CTO.",
    ],
    ["any case and spacing", "Hi < SOURCES >search_cv</ Sources >", "Hi"],
    [
      "a note the model wrote at the end of a real answer",
      "Angular, for more than 10 years. <sources>list_skills</sources>",
      "Angular, for more than 10 years.",
    ],
    ["a lone opening tag", "Hi <sources>", "Hi"],
    ["a lone closing tag", "Hi </sources>", "Hi"],
  ])(
    "removes %s with the tool names inside, so only the server writes a note",
    (_case, text, expected) => {
      expect(withoutSourcesTags(text)).toBe(expected);
    },
  );

  it("stays linear on a long run of spaces after '<', which an ambiguous pattern would make quadratic", () => {
    // Two optional runs of spaces around an optional "/" could each take the same spaces: CodeQL flagged it.
    const text = `<${" ".repeat(100_000)}x`;
    const started = performance.now();
    expect(withoutSourcesTags(text)).toBe(text.trim());
    expect(performance.now() - started).toBeLessThan(200);
  });

  it("stays linear on many opening tags with no closing one", () => {
    // Each "<sources>" looks ahead for its closing tag only up to the next "<", so the scans do not overlap.
    const text = "<sources>".repeat(20_000);
    const started = performance.now();
    expect(withoutSourcesTags(text)).toBe("");
    expect(performance.now() - started).toBeLessThan(200);
  });

  it("leaves an answer without tags as it is", () => {
    expect(withoutSourcesTags("Mirel owned the billing work.")).toBe(
      "Mirel owned the billing work.",
    );
  });
});
