import { describe, expect, it } from "vitest";
import { reportLine, type ReportFields } from "./report";

const passing: ReportFields = {
  model: "claude-haiku-5-5",
  id: "not-in-cv",
  run: 2,
  passed: true,
  seconds: 1.84,
  costUsd: 0.00032,
  progress: { done: 1, planned: 95 },
  calls: [
    { name: "search_cv", input: { query: "Vue" } },
    { name: "list_skills", input: {} },
  ],
  failures: [],
};

describe("reportLine", () => {
  it("shows the verdict, the model, the case, the run, the time, the cost and the tools used", () => {
    const line = reportLine(passing);
    expect(line).toContain("PASS");
    expect(line).toContain("claude-haiku-5-5");
    expect(line).toContain("not-in-cv");
    expect(line).toContain("#2");
    expect(line).toContain("1.8s");
    expect(line).toContain("$0.0003");
    expect(line).toContain("search_cv, list_skills");
  });

  it("shows the progress as done out of planned, so a long run can be followed", () => {
    expect(reportLine({ ...passing, progress: { done: 1, planned: 95 } })).toContain("(1/95)");
    expect(reportLine({ ...passing, progress: { done: 2, planned: 95 } })).toContain("(2/95)");
  });

  it("says so when the model answered without calling a tool", () => {
    expect(reportLine({ ...passing, calls: [] })).toContain("no tools");
  });

  it("marks a failure and gives the reasons after the tools", () => {
    const line = reportLine({ ...passing, passed: false, failures: ['missing "not in the CV"'] });
    expect(line.startsWith("FAIL")).toBe(true);
    expect(line).toContain('search_cv, list_skills  missing "not in the CV"');
  });

  it("is one line, so a run can be read and grepped line by line", () => {
    const line = reportLine({ ...passing, failures: ["a", "b"] });
    expect(line.endsWith("\n")).toBe(true);
    expect(line.slice(0, -1)).not.toContain("\n");
  });
});
