import { describe, expect, it } from "vitest";
import { educationSchema } from "./education";

const education = {
  slug: "bachelor-of-arts",
  degree: "Bachelor of Arts",
  institution: "Example University",
  location: "Bucharest, Romania",
  startYear: 2006,
  endYear: 2009,
  sourceSlug: "cv",
};

describe("educationSchema", () => {
  it("accepts a valid entry", () => {
    expect(educationSchema.safeParse(education).success).toBe(true);
  });

  it("rejects an entry that ends before it starts, and points at endYear", () => {
    const result = educationSchema.safeParse({ ...education, endYear: 2005 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["endYear"]);
  });

  it("rejects a year that is not a whole number", () => {
    expect(educationSchema.safeParse({ ...education, startYear: 2006.5 }).success).toBe(false);
  });
});
