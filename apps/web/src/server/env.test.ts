import { describe, expect, it } from "vitest";
import { readServerEnv } from "./env";

// Fictitious values: tests never see a real connection string.
const valid = "postgresql://reader:not-a-real-secret@db.example.com/portfolio?sslmode=verify-full";

describe("readServerEnv", () => {
  it("returns the database url when it is a postgres url", () => {
    expect(readServerEnv({ DATABASE_URL: valid })).toEqual({ DATABASE_URL: valid });
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["not a postgres url", "https://db.example.com/portfolio"],
  ])("names the variable when it is %s", (_case, value) => {
    expect(() => readServerEnv({ DATABASE_URL: value })).toThrow(
      "Missing or invalid environment variables: DATABASE_URL.",
    );
  });

  it("never puts the value in the error", () => {
    const leaky = "mysql://reader:not-a-real-secret@db.example.com/portfolio";
    expect(() => readServerEnv({ DATABASE_URL: leaky })).toThrow(/^(?!.*not-a-real-secret)/s);
  });
});
