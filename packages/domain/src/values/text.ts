import { z } from "zod";

/** Human-readable text: trimmed and never empty. */
export const textSchema = z.string().trim().min(1);

/**
 * An absolute https URL. Other schemes are rejected on purpose:
 * a "javascript:" URL is a valid URL, and rendered as a link it would run code (XSS).
 */
export const httpsUrlSchema = z.url({ protocol: /^https$/, hostname: z.regexes.domain });
