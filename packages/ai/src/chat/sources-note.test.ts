import { describe, expect, it } from "vitest";
import { withSourcesNote } from "./sources-note";

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
