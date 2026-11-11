import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** One page for now; case-study pages are added here when they exist. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${siteUrl}/`, changeFrequency: "monthly", priority: 1 }];
}
