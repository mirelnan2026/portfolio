import { describe, expect, it } from "vitest";
import { groupBy, toCaseStudySubject, toMobileApp, toMonth } from "./to-domain";

// The round-trip test covers every valid row; these cover the shapes the database never returns.
describe("row to domain mappers", () => {
  it("turns a date column into a month", () => {
    expect(toMonth("2023-03-01")).toBe("2023-03");
    expect(toMonth(null)).toBeNull();
  });

  it("has no mobile app when both store links are missing", () => {
    expect(toMobileApp(null, null)).toBeNull();
    expect(toMobileApp(null, "https://play.example.com")).toEqual({
      appStore: null,
      playStore: "https://play.example.com",
    });
  });

  it("rejects a case study that is about nothing", () => {
    expect(() =>
      toCaseStudySubject({ experienceSlug: null, phaseSlug: null, projectSlug: null }),
    ).toThrow("A case study must be about an experience or a project");
  });

  it("groups rows by parent and keeps their order", () => {
    const rows = [
      { parent: 1, name: "a" },
      { parent: 2, name: "b" },
      { parent: 1, name: "c" },
    ];
    expect(groupBy(rows, (row) => row.parent)).toEqual(
      new Map([
        [1, [rows[0], rows[2]]],
        [2, [rows[1]]],
      ]),
    );
  });
});
