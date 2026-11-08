import type { Experience } from "@mirelnan/domain";
import { usedSkills } from "./skill-usages";

/**
 * One contract, two phases, as in the brief. CV bullets the brief places in a phase carry its slug;
 * the brief adds only the work the CV does not mention.
 */
export const jwpConnatix = {
  slug: "jwp-connatix",
  company: "JWP Connatix",
  role: "Senior Frontend Engineer (Angular, React)",
  employmentType: "contract",
  workMode: "remote",
  location: null,
  period: { start: "2023-03", end: "2026-10" },
  phases: [
    {
      slug: "content-management-suite",
      title: "Content management suite",
      period: { start: "2023-03", end: "2024-12" },
      industrySlug: "video-content-management",
      summary:
        "Feature work across the content management suite, then the extraction of its shared " +
        "libraries and the framework migration of the multi-app workspace.",
      sourceSlug: "jwx-brief",
    },
    {
      slug: "video-platform-dashboard",
      title: "Video platform dashboard",
      period: { start: "2025-01", end: "2026-10" },
      industrySlug: "video-tech",
      summary:
        "Owning product surfaces end to end: the frontend of a new AI media-transformation product, " +
        "and metering and billing.",
      sourceSlug: "jwx-brief",
    },
  ],
  highlights: [
    {
      body:
        "Designed and built features for the JWX Dashboard, used by publishers to manage video content, " +
        "analytics and billing.",
      ownership: "contributed",
      featured: null,
      phaseSlug: "video-platform-dashboard",
      sourceSlug: "cv",
    },
    {
      body:
        "Led the frontend build-out of a new AI media-transformation product, delivered incrementally " +
        "behind feature flags and released without disrupting the flow it replaced.",
      ownership: "owned",
      featured: { title: "AI media product build-out" },
      phaseSlug: "video-platform-dashboard",
      sourceSlug: "cv",
    },
    {
      body:
        "Owned the metering and billing surface end to end, including consumption reporting, " +
        "contract-period tracking and invoice access.",
      ownership: "owned",
      featured: { title: "Metering and billing, end to end" },
      phaseSlug: "video-platform-dashboard",
      sourceSlug: "cv",
    },
    {
      body:
        "Extracted the shared frontend foundation (theming, UI component kit, GraphQL layer and shared " +
        "business rules) out of a monolithic multi-app workspace into versioned libraries, then integrated " +
        "them across the platform applications, removing duplicated UI code and giving the teams a single " +
        "source for shared UI.",
      ownership: "owned",
      featured: { title: "Shared frontend foundation" },
      phaseSlug: "content-management-suite",
      sourceSlug: "cv",
    },
    {
      body:
        "Built and owned the CI/CD pipeline that releases the shared libraries: a staged build respecting " +
        "the dependency order between them, reusable job templates for test, build and publish, and " +
        "authenticated publishing of versioned packages to the private registry.",
      ownership: "owned",
      featured: null,
      phaseSlug: null,
      sourceSlug: "cv",
    },
    {
      body:
        "Drove framework modernisation on a legacy multi-app Angular workspace: Angular 18 and Apollo " +
        "GraphQL upgrades, plus the dependency-vulnerability and static-analysis backlog.",
      ownership: "owned",
      featured: null,
      phaseSlug: "content-management-suite",
      sourceSlug: "cv",
    },
    {
      body:
        "Delivered 2026 feature work through a spec-driven workflow with Claude AI: wrote the executable " +
        "specification, drove implementation through the agent, and owned review, verification and " +
        "release of the result.",
      ownership: "owned",
      featured: { title: "Spec-driven delivery with AI agents" },
      phaseSlug: "video-platform-dashboard",
      sourceSlug: "cv",
    },
    {
      body:
        "Helped define how specifications were structured and reviewed so the approach could be handed " +
        "to other teams.",
      ownership: "contributed",
      featured: null,
      phaseSlug: null,
      sourceSlug: "cv",
    },
    {
      body: "Reporting and analytics screens: filters, dimensions, metrics, performance tables.",
      ownership: "contributed",
      featured: null,
      phaseSlug: "content-management-suite",
      sourceSlug: "jwx-brief",
    },
    {
      body: "Campaign and inventory tooling, serving configuration, creative management.",
      ownership: "contributed",
      featured: null,
      phaseSlug: "content-management-suite",
      sourceSlug: "jwx-brief",
    },
    {
      body:
        "The permission model and a staged testing mode that let features ship dark, then the cleanup " +
        "that removed it once they were live.",
      ownership: "contributed",
      featured: null,
      phaseSlug: "content-management-suite",
      sourceSlug: "jwx-brief",
    },
    {
      body: "Contract handling, player and placement management, reporting fixes.",
      ownership: "contributed",
      featured: null,
      phaseSlug: "content-management-suite",
      sourceSlug: "jwx-brief",
    },
    {
      body: "A steady line of production debugging driven by monitoring alerts.",
      ownership: "contributed",
      featured: null,
      phaseSlug: "content-management-suite",
      sourceSlug: "jwx-brief",
    },
  ],
  skills: [
    {
      skillSlug: "angular",
      phaseSlug: null,
      contextNote: "Both phases, up to and including the Angular 18 upgrade itself.",
      sourceSlug: "jwx-brief",
    },
    {
      skillSlug: "react",
      phaseSlug: "video-platform-dashboard",
      contextNote:
        "The video dashboard, rendered on Preact. Hooks, TanStack Query, component library work.",
      sourceSlug: "jwx-brief",
    },
    ...usedSkills("cv", ["typescript"]),
    {
      skillSlug: "preact",
      phaseSlug: "video-platform-dashboard",
      contextNote: null,
      sourceSlug: "jwx-brief",
    },
    {
      skillSlug: "vite",
      phaseSlug: "video-platform-dashboard",
      contextNote: "Build on the video dashboard.",
      sourceSlug: "jwx-brief",
    },
    ...usedSkills("cv", ["rxjs"]),
    {
      skillSlug: "graphql",
      phaseSlug: null,
      contextNote: "Extracted the GraphQL layer into its own package, then upgraded it.",
      sourceSlug: "jwx-brief",
    },
    {
      skillSlug: "apollo-client",
      phaseSlug: null,
      contextNote: "Extracted the GraphQL layer into its own package, then upgraded it.",
      sourceSlug: "jwx-brief",
    },
    {
      skillSlug: "vitest",
      phaseSlug: "video-platform-dashboard",
      contextNote: "Unit testing on the video dashboard.",
      sourceSlug: "jwx-brief",
    },
    {
      skillSlug: "tanstack-query",
      phaseSlug: "video-platform-dashboard",
      contextNote: null,
      sourceSlug: "jwx-brief",
    },
    {
      skillSlug: "web-components",
      phaseSlug: "video-platform-dashboard",
      contextNote: "Consumed a web-components design system on the newer stack.",
      sourceSlug: "jwx-brief",
    },
    {
      skillSlug: "spec-driven-delivery",
      phaseSlug: "video-platform-dashboard",
      contextNote: null,
      sourceSlug: "cv",
    },
  ],
  products: [
    { productSlug: "jwx-portal", phaseSlug: "content-management-suite" },
    { productSlug: "jwx-dashboard", phaseSlug: "video-platform-dashboard" },
  ],
  sourceSlug: "cv",
} satisfies Experience;
