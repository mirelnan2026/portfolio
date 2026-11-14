export interface Header {
  key: string;
  value: string;
}

/** What the Vercel toolbar on preview deployments loads (Vercel's documented CSP for it). */
const vercelToolbar = {
  "script-src": ["https://vercel.live"],
  "style-src": ["https://vercel.live"],
  "img-src": ["https://vercel.live", "https://vercel.com"],
  "font-src": ["https://vercel.live", "https://assets.vercel.com"],
  "connect-src": ["https://vercel.live", "wss://ws-us3.pusher.com"],
  "frame-src": ["https://vercel.live"],
} as const;

/**
 * The Content-Security-Policy. Everything comes from this origin. Inline scripts and styles are allowed because the
 * page is prerendered: Next.js inlines its RSC payload and Suspense scripts, and next-themes its theme script, which
 * change with every build, so neither a per-request nonce (it would make the page dynamic) nor build-time hashes
 * (headers are fixed before the build) can list them. `'unsafe-eval'` only in `next dev`, which React needs there;
 * the Vercel toolbar only off production; `upgrade-insecure-requests` only on production (it would break
 * `http://localhost`).
 */
export function contentSecurityPolicy({
  production,
  development,
}: {
  production: boolean;
  development: boolean;
}): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...(development ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'"],
    "frame-src": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  if (!production) {
    for (const [directive, sources] of Object.entries(vercelToolbar)) {
      const current = directives[directive] ?? [];
      directives[directive] = [...current.filter((source) => source !== "'none'"), ...sources];
    }
  }
  const policy = Object.entries(directives).map(
    ([name, sources]) => `${name} ${sources.join(" ")}`,
  );
  return [...policy, ...(production ? ["upgrade-insecure-requests"] : [])].join("; ");
}

/** The HTTP headers every response gets (OWASP secure headers). */
export function securityHeaders({
  production,
  development = false,
}: {
  production: boolean;
  development?: boolean;
}): Header[] {
  const headers: Header[] = [
    // HTTPS only, for two years, subdomains included (`.dev` is HTTPS-only anyway, through the HSTS preload list).
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    // The browser uses the declared content type and never guesses one (no MIME sniffing).
    { key: "X-Content-Type-Options", value: "nosniff" },
    // Other sites see only the origin, never the full URL.
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // Browser features the site never uses stay off, even for injected code.
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
    },
    // No other site may show this one in a frame (clickjacking): the old header and its CSP successor.
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Content-Security-Policy", value: contentSecurityPolicy({ production, development }) },
  ];
  // Previews and local builds must never appear in search results.
  return production ? headers : [...headers, { key: "X-Robots-Tag", value: "noindex" }];
}
