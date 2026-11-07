import type { Product } from "@mirelnan/domain";

/**
 * Public products, described from their public pages: site context only, never evidence of
 * a contribution and never given to the AI tools. Descriptive facts only, no vendor figures.
 */
export const products = [
  {
    slug: "jwx-dashboard",
    name: "JWX Dashboard",
    url: "https://dashboard.jwplayer.com/",
    description:
      "The dashboard of JWX, a video technology and monetisation platform for streamers, " +
      "publishers and advertisers: one video library to transform, distribute, engage and " +
      "monetise, delivered to any device.",
    industrySlug: "video-tech",
    sourceUrl: "https://jwx.com/",
    retrievedOn: "2026-11-07",
  },
  {
    slug: "jwx-portal",
    name: "JWX Portal",
    url: "https://portal.connatix.com/",
    description:
      "The portal of Connatix, a video technology company that merged with JW Player in " +
      "October 2024 to form JWP Connatix, now JWX.",
    industrySlug: "video-tech",
    sourceUrl:
      "https://www.llrpartners.com/connatix-and-jw-player-merge-to-create-the-industrys-largest-video-technology-and-monetization-platform/",
    retrievedOn: "2026-11-07",
  },
  {
    slug: "res-q",
    name: "Res_Q",
    url: "https://www.sware.com/products/res_q",
    description:
      "A SaaS validation platform for GxP-regulated life sciences: one place where quality, IT " +
      "and engineering teams run their validation activities, with documentation, audit trails " +
      "and role-based access.",
    industrySlug: "life-sciences",
    sourceUrl: "https://www.sware.com/products/res_q",
    retrievedOn: "2026-11-07",
  },
  {
    slug: "hpi-check",
    name: "HPI Check",
    url: "https://www.home.hpicheck.com/",
    description:
      "A UK vehicle history check by registration number: stolen and write-off records, " +
      "outstanding finance, previous keepers, scrapped status, mileage, plate changes and MOT " +
      "history, for people buying or selling a used car.",
    industrySlug: "automotive-data",
    sourceUrl: "https://www.home.hpicheck.com/",
    retrievedOn: "2026-11-07",
  },
] satisfies Product[];
