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
      "Mirel was CTO.get_profile",
    ],
    ["any case and spacing", "Hi < SOURCES >search_cv</ Sources >", "Hi search_cv"],
    ["a lone opening tag", "Hi <sources>", "Hi"],
  ])("removes %s, so only the server writes a note", (_case, text, expected) => {
    expect(withoutSourcesTags(text)).toBe(expected);
  });

  it("leaves an answer without tags as it is", () => {
    expect(withoutSourcesTags("Mirel owned the billing work.")).toBe(
      "Mirel owned the billing work.",
    );
  });
});
