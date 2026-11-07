import type { CaseStudy } from "@mirelnan/domain";

/** Only the generic "corrections to billed figures": the specifics of each correction stay out. */
export const billingCorrectness = {
  slug: "billing-correctness",
  title: "Code where approximately right is wrong",
  context:
    "The metering and billing surface shows the figures customers are invoiced against: consumption " +
    "reporting, contract-period tracking and invoice access.",
  approach:
    "Owned the surface end to end, including several corrections to the figures customers are billed on.",
  outcome: "The corrections went into the figures customers are invoiced against.",
  whatItShows:
    "Care with critical code: here, being approximately right is the same as being wrong.",
  about: {
    kind: "experience",
    experienceSlug: "jwp-connatix",
    phaseSlug: "video-platform-dashboard",
  },
  url: null,
  skillSlugs: ["react", "preact", "tanstack-query", "typescript"],
  sourceSlug: "jwx-brief",
} satisfies CaseStudy;
