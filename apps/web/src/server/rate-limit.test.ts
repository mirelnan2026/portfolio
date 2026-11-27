import { beforeEach, describe, expect, it, vi } from "vitest";

// Fictitious Upstash: the tests never reach Redis. `limit` answers whatever the test sets in `next`.
const upstash = vi.hoisted(() => ({
  next: {
    success: true,
    reset: 0,
    pending: Promise.resolve(),
    reason: undefined as string | undefined,
  },
  configs: [] as Record<string, unknown>[],
}));

vi.mock("server-only", () => ({}));
vi.mock("@upstash/redis", () => ({
  Redis: class {
    readonly fake = true;
  },
}));
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow = () => "sliding-window";
    constructor(config: Record<string, unknown>) {
      upstash.configs.push(config);
    }
    limit = () => Promise.resolve(upstash.next);
  },
}));
vi.mock("@vercel/functions", () => ({
  ipAddress: () => "203.0.113.7",
  waitUntil: () => undefined,
}));
// The app's `@/` alias is a TypeScript path that Vitest does not resolve: point it at the real module.
vi.mock("@/lib/rate-limit", () => import("../lib/rate-limit"));

const { createRateLimit } = await import("./rate-limit");

const env = { UPSTASH_REDIS_REST_URL: "https://example.upstash.io", UPSTASH_REDIS_REST_TOKEN: "x" };
const request = new Request("https://mirelnan.dev/api/chat", { method: "POST" });
const policy = { name: "test", requests: 5, window: "1 m" } as const;

beforeEach(() => {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", env.UPSTASH_REDIS_REST_URL);
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", env.UPSTASH_REDIS_REST_TOKEN);
  upstash.next = { success: true, reset: 0, pending: Promise.resolve(), reason: undefined };
  upstash.configs.length = 0;
});

describe("createRateLimit", () => {
  it("lets a request under the limit through", async () => {
    await expect(createRateLimit(policy)(request)).resolves.toBeNull();
  });

  it("answers 429 over the limit", async () => {
    upstash.next = { ...upstash.next, success: false, reset: Date.now() + 3_000 };
    const response = await createRateLimit(policy)(request);
    expect(response?.status).toBe(429);
  });

  // On a timeout the library answers success: true, so the reason decides.
  it("lets the request through on a timeout by default", async () => {
    upstash.next = { ...upstash.next, reason: "timeout" };
    await expect(createRateLimit(policy)(request)).resolves.toBeNull();
  });

  it("answers 503 on a timeout when the policy denies", async () => {
    upstash.next = { ...upstash.next, reason: "timeout" };
    const response = await createRateLimit({ ...policy, onTimeout: "deny" })(request);
    expect(response?.status).toBe(503);
  });

  it.each([["cacheBlock"], ["denyList"]])(
    "treats a %s answer by its success, not as a timeout",
    async (reason) => {
      upstash.next = { ...upstash.next, success: false, reset: Date.now() + 1_000, reason };
      const response = await createRateLimit({ ...policy, onTimeout: "deny" })(request);
      expect(response?.status).toBe(429);
    },
  );

  it("passes the timeout and a prefix per route to the limiter", async () => {
    await createRateLimit({ ...policy, name: "chat-minute", timeout: 2_000 })(request);
    expect(upstash.configs[0]).toMatchObject({ prefix: "ratelimit:chat-minute", timeout: 2_000 });
  });
});
