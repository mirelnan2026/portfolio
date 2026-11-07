import type { CaseStudy } from "@mirelnan/domain";

export const darkLaunchBehindFlag = {
  slug: "dark-launch-behind-flag",
  title: "Shipping a product nobody could see",
  context:
    "A new AI media-transformation product, with configurable processing agents, templates, output " +
    "review and progress tracking, had to replace a live flow without disrupting it.",
  approach:
    "Shipped it incrementally behind a feature flag: each change reached production safely on its own, " +
    "because the flag kept the old path live. Then one change turned it on and deleted the flow it replaced.",
  outcome:
    "Users moved to the new product in a single step, and the largest change of the year was mostly " +
    "a deletion.",
  whatItShows:
    "Trunk-based, incremental delivery with feature flags, done for real rather than by the textbook.",
  about: {
    kind: "experience",
    experienceSlug: "jwp-connatix",
    phaseSlug: "video-platform-dashboard",
  },
  url: null,
  skillSlugs: ["react", "preact", "tanstack-query", "typescript"],
  sourceSlug: "jwx-brief",
} satisfies CaseStudy;
