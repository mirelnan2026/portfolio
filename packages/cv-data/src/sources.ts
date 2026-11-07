import type { Source } from "@mirelnan/domain";

/** The approved documents. Every claim in this package points to one of them with `sourceSlug`. */
export const sources = [
  { slug: "cv", kind: "cv", title: "CV: Senior Frontend Engineer" },
  { slug: "jwx-brief", kind: "employment-brief", title: "JWX engagement brief, 2023–2026" },
] satisfies Source[];
