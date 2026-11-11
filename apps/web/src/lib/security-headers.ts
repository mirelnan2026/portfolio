export interface Header {
  key: string;
  value: string;
}

/**
 * The HTTP headers every response gets (OWASP secure headers). The full Content-Security-Policy, with
 * `script-src`, comes later; this one only blocks framing, plugins and foreign form targets.
 */
export function securityHeaders({ production }: { production: boolean }): Header[] {
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
      value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    },
    // No other site may show this one in a frame (clickjacking): the old header and its CSP successor.
    { key: "X-Frame-Options", value: "DENY" },
    {
      key: "Content-Security-Policy",
      value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
    },
  ];
  // Previews and local builds must never appear in search results.
  return production ? headers : [...headers, { key: "X-Robots-Tag", value: "noindex" }];
}
