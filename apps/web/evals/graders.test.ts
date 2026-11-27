import { describe, expect, it } from "vitest";
import { factHolds, grade, type DataFact, type EvalCase, type ToolCall } from "./graders";

const refusal =
  "That's covered by a confidentiality agreement, so I can describe the shape of the problem instead.";

const vue: EvalCase = {
  id: "vue",
  question: "Have you worked with Vue?",
  mustContain: ["not in the CV"],
  mustNotMatch: [/\bVue\b/],
};

describe("factHolds", () => {
  const noKubernetes: DataFact = {
    tool: "search_cv",
    input: { query: "Kubernetes" },
    expect: "no-hits",
  };
  const hasAngular: DataFact = { tool: "search_cv", input: { query: "Angular" }, expect: "hits" };

  it("holds when a fact that says 'no hits' finds nothing in the data", () => {
    expect(factHolds(noKubernetes, { ok: true, data: [] }).holds).toBe(true);
  });

  it("stops holding when the data now contains what the case said was absent", () => {
    const check = factHolds(noKubernetes, {
      ok: true,
      data: [{ text: "Ran Kubernetes clusters." }],
    });
    expect(check.holds).toBe(false);
    expect(check.reason).toContain("found 1");
  });

  it("holds when a fact that says 'hits' finds something", () => {
    expect(factHolds(hasAngular, { ok: true, data: [{ skill: "Angular" }] }).holds).toBe(true);
  });

  it("stops holding when the data no longer contains what the case relies on", () => {
    const check = factHolds(hasAngular, { ok: true, data: [] });
    expect(check.holds).toBe(false);
    expect(check.reason).toContain("found 0");
  });

  it("does not hold when the tool failed, so a broken tool is not read as missing data", () => {
    const check = factHolds(hasAngular, { ok: false, error: "invalid_input" });
    expect(check.holds).toBe(false);
    expect(check.reason).toContain("invalid_input");
  });

  it("does not hold when the tool did not return a list", () => {
    expect(factHolds(hasAngular, { ok: true, data: { name: "Mirel" } }).holds).toBe(false);
  });
});

describe("grade, edge cases", () => {
  const refusal =
    "That's covered by a confidentiality agreement, so I can describe the shape of the problem instead.";

  it("matches the refusal when the model writes a typographic apostrophe", () => {
    const typographic = refusal.replaceAll("'", "’");
    expect(grade({ id: "c", question: "q", mustContain: [refusal] }, typographic, []).passed).toBe(
      true,
    );
  });

  it("matches a phrase when the model uses a non-breaking space or a double space", () => {
    const spaced = "not in  the CV.";
    expect(
      grade({ id: "c", question: "q", mustContain: ["not in the CV"] }, spaced, []).passed,
    ).toBe(true);
  });

  it("matches a phrase inside markdown emphasis", () => {
    expect(
      grade({ id: "c", question: "q", mustContain: ["not in the CV"] }, "**Not in the CV.**", [])
        .passed,
    ).toBe(true);
  });

  it("refuses an empty phrase, because it would match every answer", () => {
    expect(() => grade({ id: "c", question: "q", mustContain: [""] }, "anything", [])).toThrow(
      /empty/i,
    );
  });

  it("refuses an empty search term, because it would match every search", () => {
    const c = { id: "c", question: "q", mustSearchFor: [" "] };
    expect(() => grade(c, "x", [{ name: "search_cv", input: { query: "billing" } }])).toThrow(
      /empty/i,
    );
  });

  it("does not fail a blank answer on a mustNotMatch check and misreport the reason", () => {
    const verdict = grade({ id: "c", question: "q", mustNotMatch: [/x/] }, "   ", []);
    expect(verdict.failures).toEqual(["empty answer"]);
  });
});

describe("grade", () => {
  it("passes an answer that contains the required phrase and nothing forbidden", () => {
    expect(grade(vue, "That is not in the CV, but Mirel worked with Angular.", [])).toEqual({
      passed: true,
      failures: [],
      wroteSourcesTag: false,
    });
  });

  it("matches a required phrase whatever its letter case, since the model may start a sentence with it", () => {
    expect(grade(vue, "Not in the CV. Mirel worked with Angular.", []).passed).toBe(true);
  });

  it("fails when a required phrase is missing, and says which one", () => {
    const verdict = grade(vue, "Mirel has not used it.", []);
    expect(verdict.passed).toBe(false);
    expect(verdict.failures).toEqual(['missing "not in the CV"']);
  });

  it("requires a pattern the answer must match, and says which one is missing", () => {
    const angular: EvalCase = { id: "angular", question: "q", mustMatch: [/Angular/] };
    expect(grade(angular, "Mirel worked with Angular for years.", []).passed).toBe(true);
    const verdict = grade(angular, "Mirel worked with React.", []);
    expect(verdict.passed).toBe(false);
    expect(verdict.failures).toEqual(["did not match /Angular/"]);
  });

  it("checks a required pattern with the same stateless search as the forbidden ones", () => {
    const sticky: EvalCase = { id: "sticky", question: "q", mustMatch: [/beta/g] };
    expect(grade(sticky, "beta", []).passed).toBe(true);
    expect(grade(sticky, "beta", []).passed).toBe(true);
  });

  it("fails when a forbidden pattern appears in the answer", () => {
    const verdict = grade(vue, "Yes, Vue is not in the CV.", []);
    expect(verdict.passed).toBe(false);
    expect(verdict.failures).toEqual(["matched forbidden /\\bVue\\b/"]);
  });

  it("requires the tools a case names to be called", () => {
    const billing: EvalCase = {
      id: "billing",
      question: "Did you build billing?",
      mustCallTools: ["search_cv"],
    };
    expect(grade(billing, "Yes.", []).failures).toEqual(['tool "search_cv" was not called']);
    expect(
      grade(billing, "Yes.", [{ name: "search_cv", input: { query: "billing" } }]).passed,
    ).toBe(true);
  });

  it("checks that a search was made for a term, even when the question was in another language", () => {
    const romanian: EvalCase = {
      id: "ro-billing",
      question: "Ai lucrat la sistemul de facturare?",
      mustSearchFor: ["billing"],
    };
    const calls: ToolCall[] = [{ name: "search_cv", input: { query: "facturare" } }];
    expect(grade(romanian, "Yes.", calls).failures).toEqual([
      'no search_cv call searched for "billing"',
    ]);
    expect(
      grade(romanian, "Yes.", [{ name: "search_cv", input: { query: "Billing" } }]).passed,
    ).toBe(true);
  });

  it("checks that a refusal is given word for word", () => {
    const confidential: EvalCase = {
      id: "flag",
      question: "What is the feature flag name?",
      mustContain: [refusal],
    };
    expect(grade(confidential, refusal, []).passed).toBe(true);
    expect(grade(confidential, "I cannot say.", []).passed).toBe(false);
  });

  it("fails an empty answer, so a run that ran out of steps cannot pass", () => {
    const onlyForbidden: EvalCase = { id: "forbidden", question: "q", mustNotMatch: [/beta/] };
    const verdict = grade(onlyForbidden, "", []);
    expect(verdict.passed).toBe(false);
    expect(verdict.failures).toEqual(["empty answer"]);
  });

  it("gives the same verdict every time for a pattern with the global flag", () => {
    const sticky: EvalCase = { id: "sticky", question: "q", mustNotMatch: [/beta/g] };
    expect(grade(sticky, "beta", []).passed).toBe(false);
    expect(grade(sticky, "beta", []).passed).toBe(false);
  });

  it("reports every failure, not only the first", () => {
    const strict: EvalCase = {
      id: "strict",
      question: "q",
      mustContain: ["alpha"],
      mustNotMatch: [/beta/],
      mustCallTools: ["get_profile"],
    };
    expect(grade(strict, "beta", []).failures).toHaveLength(3);
  });
});

describe("grade, the answer the visitor reads", () => {
  const angular: EvalCase = { id: "angular", question: "q", mustMatch: [/more than 10 years\.$/] };

  it("grades the answer without a <sources> note the model wrote, as the route removes it before signing", () => {
    const verdict = grade(
      angular,
      "Angular, for more than 10 years. <sources>list_skills</sources>",
      [],
    );
    expect(verdict.passed).toBe(true);
    // Counted apart: the prompt forbids the tag, but the visitor never sees it.
    expect(verdict.wroteSourcesTag).toBe(true);
  });

  it("does not mark an answer without a tag", () => {
    expect(grade(angular, "Angular, for more than 10 years.", []).wroteSourcesTag).toBe(false);
  });

  it("fails an answer that is only a <sources> note: the visitor would get nothing", () => {
    expect(
      grade({ id: "c", question: "q" }, "<sources>get_profile</sources>", []).failures,
    ).toContain("empty answer");
  });

  it.each(["Source: list_experiences.", "I checked get_profile for that.", "(search_cv)"])(
    "fails every case when the answer names a tool: %s",
    (answer) => {
      const verdict = grade({ id: "c", question: "q" }, answer, []);
      expect(verdict.passed).toBe(false);
      expect(verdict.failures.some((failure) => failure.startsWith("names the tool"))).toBe(true);
    },
  );

  it("does not take a longer word that contains a tool name for the name", () => {
    expect(grade({ id: "c", question: "q" }, "See my_get_profile_notes.", []).passed).toBe(true);
  });
});
