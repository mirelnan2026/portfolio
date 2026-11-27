import "server-only";
import { type Duration, Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { ipAddress, waitUntil } from "@vercel/functions";
import { rateLimitUnavailable, retryAfterSeconds, tooManyRequests } from "@/lib/rate-limit";
import { readRateLimitEnv } from "./env";

export interface RateLimitPolicy {
  /** Part of the Redis key, so each route counts on its own. */
  name: string;
  requests: number;
  window: Duration;
  /** How long to wait for Upstash, in milliseconds (the library's default is 5 s). */
  timeout?: number;
  /** When Upstash does not answer in time: let the request through, or refuse it with a 503. */
  onTimeout?: "allow" | "deny";
}

// One client per instance, created on the first request (the build never reads these variables).
let redis: Redis | undefined;

function getRedis(): Redis {
  if (!redis) {
    const env = readRateLimitEnv(process.env);
    redis = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN });
  }
  return redis;
}

/**
 * A sliding-window limit per client IP. The returned check gives a 429 response when the client is over
 * the limit, or null when the request may go on.
 */
export function createRateLimit({
  name,
  requests,
  window,
  timeout,
  onTimeout = "allow",
}: RateLimitPolicy) {
  let limiter: Ratelimit | undefined;

  return async function rateLimit(request: Request): Promise<Response | null> {
    limiter ??= new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(requests, window),
      prefix: `ratelimit:${name}`,
      timeout,
    });
    // Set by Vercel's edge, which overwrites what the client sends; absent locally.
    const { success, reset, pending, reason } = await limiter.limit(
      ipAddress(request) ?? "unknown",
    );
    waitUntil(pending);
    // On a timeout the library answers success: true; a route that costs money refuses instead.
    if (reason === "timeout" && onTimeout === "deny") return rateLimitUnavailable();
    return success ? null : tooManyRequests(retryAfterSeconds(reset, Date.now()));
  };
}
