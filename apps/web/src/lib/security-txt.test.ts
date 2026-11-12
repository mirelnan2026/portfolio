import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { siteUrl } from "./site";

/** RFC 9116: `public/.well-known/security.txt` is served as is, so its fields are checked here. */
const text = readFileSync(
  new URL("../../public/.well-known/security.txt", import.meta.url),
  "utf8",
);

function field(name: string): string[] {
  return text
    .split("\n")
    .filter((line) => line.startsWith(`${name}: `))
    .map((line) => line.slice(name.length + 2).trim());
}

describe("security.txt", () => {
  it("has a contact and points to itself on the canonical origin", () => {
    expect(field("Contact").length).toBeGreaterThan(0);
    expect(field("Canonical")).toEqual([`${siteUrl}/.well-known/security.txt`]);
  });

  it("expires within a year but not in the next 30 days", () => {
    // Fails a month before the date, in CI, so the file is renewed before it goes stale.
    const [expires] = field("Expires");
    const days = (Date.parse(expires ?? "") - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(30);
    expect(days).toBeLessThanOrEqual(366);
  });
});
