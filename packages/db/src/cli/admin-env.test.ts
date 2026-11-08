import { describe, expect, it } from "vitest";
import { readAdminDatabaseUrl } from "./admin-env";

// Fictitious connection strings: no real host, user or password.
describe("admin database url", () => {
  it("accepts a postgresql:// url", () => {
    const url = "postgresql://owner:example@db.example.com/portfolio?sslmode=verify-full";
    expect(readAdminDatabaseUrl({ DATABASE_ADMIN_URL: url })).toBe(url);
  });

  it("rejects a missing variable", () => {
    expect(() => readAdminDatabaseUrl({})).toThrow("DATABASE_ADMIN_URL is missing");
  });

  it("rejects another protocol without echoing the value", () => {
    const read = () =>
      readAdminDatabaseUrl({ DATABASE_ADMIN_URL: "https://owner:not-a-secret@db.example.com/x" });
    expect(read).toThrow("is not a postgresql:// URL");
    expect(read).not.toThrow("not-a-secret");
  });
});
