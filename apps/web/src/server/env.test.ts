import { describe, expect, it } from "vitest";
import { readAnthropicEnv, readRateLimitEnv, readServerEnv } from "./env";

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

describe("readRateLimitEnv", () => {
  const url = "https://example-12345.upstash.io";
  const token = "not-a-real-token";

  it("returns the Upstash url and token", () => {
    expect(
      readRateLimitEnv({ UPSTASH_REDIS_REST_URL: url, UPSTASH_REDIS_REST_TOKEN: token }),
    ).toEqual({
      UPSTASH_REDIS_REST_URL: url,
      UPSTASH_REDIS_REST_TOKEN: token,
    });
  });

  it.each([
    ["the url is missing", { UPSTASH_REDIS_REST_TOKEN: token }, "UPSTASH_REDIS_REST_URL"],
    [
      "the url is not https",
      { UPSTASH_REDIS_REST_URL: "http://example.upstash.io", UPSTASH_REDIS_REST_TOKEN: token },
      "UPSTASH_REDIS_REST_URL",
    ],
    [
      "the token is empty",
      { UPSTASH_REDIS_REST_URL: url, UPSTASH_REDIS_REST_TOKEN: "" },
      "UPSTASH_REDIS_REST_TOKEN",
    ],
  ])("names the variable when %s", (_case, env, name) => {
    expect(() => readRateLimitEnv(env)).toThrow(
      `Missing or invalid environment variables: ${name}.`,
    );
  });

  it("never puts the token in the error", () => {
    expect(() =>
      readRateLimitEnv({ UPSTASH_REDIS_REST_URL: "not a url", UPSTASH_REDIS_REST_TOKEN: token }),
    ).toThrow(/^(?!.*not-a-real-token)/s);
  });
});

describe("readAnthropicEnv", () => {
  // Fictitious: the prefix is the only thing the validation looks at.
  const key = "sk-ant-not-a-real-key";

  it("returns the key when it has the Anthropic prefix", () => {
    expect(readAnthropicEnv({ ANTHROPIC_API_KEY: key })).toEqual({ ANTHROPIC_API_KEY: key });
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["not an Anthropic key", "sk-openai-not-a-real-key"],
  ])("names the variable when it is %s", (_case, value) => {
    expect(() => readAnthropicEnv({ ANTHROPIC_API_KEY: value })).toThrow(
      "Missing or invalid environment variables: ANTHROPIC_API_KEY.",
    );
  });

  it("never puts the value in the error", () => {
    const leaky = "sk-openai-leaked-value-not-a-real-key";
    expect(() => readAnthropicEnv({ ANTHROPIC_API_KEY: leaky })).toThrow(/^(?!.*leaked-value)/s);
  });
});
