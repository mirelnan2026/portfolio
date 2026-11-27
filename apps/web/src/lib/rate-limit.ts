/** Seconds until the window resets: Retry-After takes whole seconds, so round up, and never say 0. */
export function retryAfterSeconds(resetAt: number, now: number): number {
  return Math.max(1, Math.ceil((resetAt - now) / 1000));
}

/** The answer to a client over its limit: a generic message, the time to wait, never cached. */
export function tooManyRequests(retryAfter: number): Response {
  return Response.json(
    { error: "Too many requests. Try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfter), "Cache-Control": "no-store" } },
  );
}

/** The answer when the limiter cannot decide in time: generic, so it does not say which service is down. */
export function rateLimitUnavailable(): Response {
  return Response.json(
    { error: "The service is unavailable right now. Try again later." },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
