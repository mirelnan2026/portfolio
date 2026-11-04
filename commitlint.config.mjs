/**
 * Commit message rules: Conventional Commits + project scopes.
 * Runs in the commit-msg hook (lefthook) and, from step 6, in CI.
 */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "header-max-length": [2, "always", 72],
    "scope-enum": [
      2,
      "always",
      ["web", "mcp-server", "domain", "cv-data", "db", "ai", "tooling", "ci", "deps"],
    ],
  },
};

export default config;
