import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** The pages search engines should know; case-study pages are added here when they exist. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${siteUrl}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/accessibility`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
