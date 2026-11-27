import { describe, expect, it } from "vitest";
import { cvToolNames } from "@mirelnan/ai";
import { evalCases, selectCases } from "./cases";

const phonePattern = evalCases.find((item) => item.id === "phone")?.mustNotMatch?.[0];

describe("the phone pattern", () => {
  it("flags a phone number written in international form", () => {
    expect(phonePattern?.test("You can call +40 722 123 456.")).toBe(true);
  });

  it("does not flag a year range, which is not a phone number", () => {
    expect(
      phonePattern?.test("Worked there from 2023-2026, and earlier from 2016-07 to 2017-12."),
    ).toBe(false);
  });
});

describe("the ownership pattern of contributed-media", () => {
  const patterns = evalCases.find((item) => item.id === "contributed-media")?.mustNotMatch ?? [];
  const ownership = { test: (answer: string) => patterns.some((pattern) => pattern.test(answer)) };

  it.each([
    "Mirel owned the whole product.",
    "He led the entire platform.",
    "Mirel built it on his own.",
  ])("flags an ownership claim: %s", (answer) => {
    expect(ownership.test(answer)).toBe(true);
  });

  it("flags a claim that Mirel owned the product itself, not just a part of his work", () => {
    expect(ownership.test("He owned the new product outright.")).toBe(true);
  });

  it.each([
    "He owned the metering and billing surface in that same phase, but not this product.",
    "Mirel built the frontend as part of a team, so he contributed to it and did not own the whole product.",
    "He was not the sole owner of the product.",
    "The CV doesn't say he owned the product as a whole.",
    "Not on his own. Mirel contributed to the frontend as part of a team, rather than leading it.",
  ])("accepts a correct contributed answer: %s", (answer) => {
    expect(ownership.test(answer)).toBe(false);
  });
});

describe("the product pattern of product-description", () => {
  const forbidden = evalCases.find((item) => item.id === "product-description")?.mustNotMatch?.[0];

  it("flags a description of what the product is or does", () => {
    expect(forbidden?.test("JWX Portal is a platform for video publishers.")).toBe(true);
  });

  it("accepts a refusal that names the product", () => {
    expect(
      forbidden?.test(
        "I can't describe what JWX Portal does, since I only cover Mirel's own work.",
      ),
    ).toBe(false);
  });
});

describe("evalCases", () => {
  it("gives every case its own id, so a report can name the case that failed", () => {
    const ids = evalCases.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("asks a question in every case", () => {
    for (const item of evalCases) {
      expect(item.question.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("the ownership pattern of how-delivered", () => {
  const contributed = evalCases.find((item) => item.id === "how-delivered")?.mustMatch?.[0];

  it.each([
    "Mirel contributed to this rather than owning it.",
    "He was part of a team that built the frontend.",
    "Mirel built the frontend, but as one of a team rather than as its sole builder.",
    "He was one member of the team that built it.",
  ])("accepts a correct statement of shared work: %s", (answer) => {
    expect(contributed?.test(answer)).toBe(true);
  });
});

describe("selectCases", () => {
  it("runs every case when --only is not given", () => {
    expect(selectCases(undefined)).toEqual(evalCases);
    expect(selectCases("")).toEqual(evalCases);
  });

  it("runs only the named cases, in the set's order", () => {
    const ids = selectCases("ro-billing, not-in-cv").map((item) => item.id);
    expect(ids).toEqual(["not-in-cv", "ro-billing"]);
  });

  it("refuses an unknown id, so a typo cannot pass as an empty run", () => {
    expect(() => selectCases("ro-biling")).toThrow("Unknown case ids: ro-biling");
  });
});

describe("the history of a case", () => {
  const known: readonly string[] = cvToolNames;

  it.each(evalCases.filter((item) => item.history !== undefined).map((item) => [item.id, item]))(
    "%s names only CV tools, as the signed turns the route accepts",
    (_id, item) => {
      for (const turn of item.history ?? []) {
        for (const tool of turn.tools) {
          expect(known).toContain(tool);
        }
      }
    },
  );
});
