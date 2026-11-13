import { describe, expect, it } from "vitest";
import { workflowIntro } from "./workflow";

describe("workflowIntro", () => {
  it("picks the summary's sentence about spec-driven development, word for word", () => {
    expect(
      workflowIntro(
        "Builds web applications. In 2026 joined a team adopting Spec-Driven Development. Lives in Bucharest.",
      ),
    ).toBe("In 2026 joined a team adopting Spec-Driven Development.");
  });

  it("is null when the summary does not mention it", () => {
    expect(workflowIntro("Builds web applications. Lives in Bucharest.")).toBeNull();
  });
});
