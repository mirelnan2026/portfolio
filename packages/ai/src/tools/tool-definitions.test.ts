import { describe, expect, it } from "vitest";
import { cvToolNames } from "./cv-tools";
import { cvToolDefinitions } from "./tool-definitions";

describe("cvToolDefinitions", () => {
  it("has one definition per tool, in the registry's order", () => {
    expect(cvToolDefinitions.map((definition) => definition.name)).toEqual(cvToolNames);
  });

  it.each(cvToolNames)("gives %s a description the model can choose it by", (name) => {
    const definition = cvToolDefinitions.find((item) => item.name === name);
    expect(definition?.description.length).toBeGreaterThanOrEqual(40);
    expect(definition?.description.length).toBeLessThanOrEqual(400);
  });

  it.each(cvToolNames)("%s takes a closed object: no property outside the schema", (name) => {
    const definition = cvToolDefinitions.find((item) => item.name === name);
    expect(definition?.input_schema).toMatchObject({ type: "object", additionalProperties: false });
  });

  it("tells the model what search_cv does not cover, so it looks elsewhere for those", () => {
    const search = cvToolDefinitions.find((item) => item.name === "search_cv");
    expect(search?.description).toMatch(/does not search case studies or the workflow/i);
  });

  it("tells the model that the workflow names no tools, so a question about tools goes to search_cv", () => {
    const workflow = cvToolDefinitions.find((item) => item.name === "get_workflow");
    expect(workflow?.description).toMatch(/names no tools/i);
    expect(workflow?.description).toMatch(/search_cv/);
  });

  it("bounds the search query, so one request cannot carry a long text", () => {
    const search = cvToolDefinitions.find((item) => item.name === "search_cv");
    const query = (search?.input_schema as { properties: { query: { maxLength?: number } } })
      .properties.query;
    expect(query.maxLength).toBe(200);
  });

  it("exposes no product fields in any schema", () => {
    expect(JSON.stringify(cvToolDefinitions.map((item) => item.input_schema))).not.toMatch(
      /product/i,
    );
  });

  it("gives the slug-based tools a slug that is lowercase and hyphenated", () => {
    const experience = cvToolDefinitions.find((item) => item.name === "get_experience");
    const slug = (experience?.input_schema as { properties: { slug: { pattern?: string } } })
      .properties.slug;
    expect(slug.pattern).toBeDefined();
    expect(new RegExp(slug.pattern ?? "").test("jwp-connatix")).toBe(true);
    expect(new RegExp(slug.pattern ?? "").test("Not A Slug")).toBe(false);
  });
});
