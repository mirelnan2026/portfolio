import { describe, expect, it } from "vitest";
import { retryAfterSeconds, tooManyRequests } from "./rate-limit";

const now = 1_000_000;

describe("retryAfterSeconds", () => {
  it.each([
    ["a whole number of seconds", now + 3000, 3],
    ["a fraction, rounded up", now + 2001, 3],
    ["less than a second, at least 1", now + 1, 1],
    ["a reset already passed, at least 1", now - 500, 1],
  ])("returns %s", (_case, resetAt, expected) => {
    expect(retryAfterSeconds(resetAt, now)).toBe(expected);
  });
});

describe("tooManyRequests", () => {
  it("is a 429 that says when to retry and is never cached", () => {
    const response = tooManyRequests(7);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("7");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("returns a generic JSON error", async () => {
    await expect(tooManyRequests(7).json()).resolves.toEqual({
      error: "Too many requests. Try again later.",
    });
  });
});
