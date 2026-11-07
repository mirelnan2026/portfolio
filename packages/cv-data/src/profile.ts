import type { Profile } from "@mirelnan/domain";

export const profile = {
  name: "Mirel Nan",
  headline: "Senior Frontend Engineer · Spec-Driven Delivery with AI Agents",
  summary:
    "Frontend engineer with 15+ years of experience building and scaling production web applications, " +
    "working fully remote since 2020. Specialised in large Angular and React codebases, covering feature " +
    "delivery, framework migrations and design-system work. Most recently worked on a video platform " +
    "dashboard used by publishers to manage content, analytics and AI-driven media transformation. " +
    "In 2026 joined the first team in the company to adopt spec-driven development with Claude AI.",
  location: "Bucharest, Romania",
  availability: "Open to remote",
  email: "nan.mirel@gmail.com",
  linkedinUrl: "https://www.linkedin.com/in/mirelnan",
  interests: ["Full-stack technologies", "Reading", "Chess", "Football"],
  sourceSlug: "cv",
} satisfies Profile;
