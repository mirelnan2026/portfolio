import type { CaseStudy } from "@mirelnan/domain";

export const upgradeSequencing = {
  slug: "upgrade-sequencing",
  title: "Sequencing two risky upgrades",
  context:
    "A multi-app Angular workspace, with four deployable applications and shared feature libraries, " +
    "needed both an Apollo Client and Apollo Angular upgrade and the Angular 18 upgrade.",
  approach:
    "Landed the Apollo upgrade two weeks before the framework upgrade, then delivered Angular 18 " +
    "across the workspace as a single reviewable change.",
  outcome: "Any regression could be attributed to one of the two upgrades, never to both at once.",
  whatItShows: "Risk management: choosing the order of changes so that problems stay attributable.",
  about: {
    kind: "experience",
    experienceSlug: "jwp-connatix",
    phaseSlug: "content-management-suite",
  },
  url: null,
  skillSlugs: ["angular", "apollo-client", "graphql"],
  sourceSlug: "jwx-brief",
} satisfies CaseStudy;
