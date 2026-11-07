import type { CaseStudy } from "@mirelnan/domain";

export const sharedLibraryExtraction = {
  slug: "shared-library-extraction",
  title: "Extracting a shared frontend foundation",
  context:
    "Several applications lived in one monolithic multi-app workspace and duplicated the same theme, " +
    "components, GraphQL layer and business rules.",
  approach:
    "Pulled four libraries (theme, components, GraphQL and rules) out of the workspace, published them " +
    "as separately versioned packages, then integrated them back into three applications.",
  outcome:
    "The three applications share one source for UI, and users saw no visible break along the way.",
  whatItShows:
    "Working at the level of the architecture rather than the screen: a large refactor delivered " +
    "without disrupting users.",
  about: {
    kind: "experience",
    experienceSlug: "jwp-connatix",
    phaseSlug: "content-management-suite",
  },
  url: null,
  skillSlugs: ["angular", "typescript", "graphql"],
  sourceSlug: "jwx-brief",
} satisfies CaseStudy;
