import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, securityHeaders } from "./security-headers";

const keys = (production: boolean) => securityHeaders({ production }).map((header) => header.key);

/** The policy as `{ directive: sources }`, to assert on one directive at a time. */
function directives(production: boolean, development = false): Record<string, string[]> {
  return Object.fromEntries(
    contentSecurityPolicy({ production, development })
      .split("; ")
      .map((directive) => {
        const [name = "", ...sources] = directive.split(" ");
        return [name, sources];
      }),
  );
}

describe("securityHeaders", () => {
  it.each([true, false])("sends each header once (production: %s)", (production) => {
    expect(new Set(keys(production)).size).toBe(keys(production).length);
  });

  it("lets only production be indexed", () => {
    expect(keys(true)).not.toContain("X-Robots-Tag");
    expect(securityHeaders({ production: false })).toContainEqual({
      key: "X-Robots-Tag",
      value: "noindex",
    });
  });
});

describe("contentSecurityPolicy", () => {
  it("loads everything from this origin only, and nothing in frames, plugins or foreign forms", () => {
    const production = directives(true);
    for (const name of ["default-src", "font-src", "connect-src"]) {
      expect(production[name]).toEqual(["'self'"]);
    }
    expect(production).toMatchObject({
      "frame-ancestors": ["'none'"],
      "frame-src": ["'none'"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
      "upgrade-insecure-requests": [],
    });
  });

  it("never allows eval in production, only in next dev", () => {
    expect(directives(true)["script-src"]).not.toContain("'unsafe-eval'");
    expect(directives(false, true)["script-src"]).toContain("'unsafe-eval'");
  });

  it("allows the Vercel toolbar on previews only", () => {
    expect(contentSecurityPolicy({ production: true, development: false })).not.toContain(
      "vercel.live",
    );
    expect(directives(false)["frame-src"]).toEqual(["https://vercel.live"]);
    expect(directives(false)["script-src"]).toContain("https://vercel.live");
  });

  it("does not upgrade requests off production, where http://localhost must keep working", () => {
    expect(directives(false)).not.toHaveProperty("upgrade-insecure-requests");
  });
});
