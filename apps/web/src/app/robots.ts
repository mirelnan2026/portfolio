import type { MetadataRoute } from "next";
import { isProductionDeployment } from "@/lib/deployment";
import { siteUrl } from "@/lib/site";

/** Every crawler is welcome on production, AI search included; previews and local builds are closed. */
export default function robots(): MetadataRoute.Robots {
  if (!isProductionDeployment()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${siteUrl}/sitemap.xml` };
}
