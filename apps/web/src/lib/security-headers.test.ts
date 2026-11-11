import { describe, expect, it } from "vitest";
import { securityHeaders } from "./security-headers";

const keys = (production: boolean) => securityHeaders({ production }).map((header) => header.key);

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

  it("forbids framing the site", () => {
    const csp = securityHeaders({ production: true }).find(
      (header) => header.key === "Content-Security-Policy",
    );
    expect(csp?.value).toContain("frame-ancestors 'none'");
  });
});
