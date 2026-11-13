import type { Metadata } from "next";
import { caseStudyCards } from "@/features/portfolio/case-studies";
import { CaseStudies } from "@/features/portfolio/components/case-studies";
import { Experience } from "@/features/portfolio/components/experience";
import { Hero } from "@/features/portfolio/components/hero";
import { Highlights } from "@/features/portfolio/components/highlights";
import { HowIWork } from "@/features/portfolio/components/how-i-work";
import { Skills } from "@/features/portfolio/components/skills";
import { highlightCards } from "@/features/portfolio/highlights";
import { portfolioMetadata } from "@/features/portfolio/metadata";
import {
  getCaseStudies,
  getCurrentMonth,
  getExperiences,
  getIndustries,
  getProducts,
  getProfile,
  getSkills,
  getWorkflow,
} from "@/features/portfolio/queries";
import { skillGroups } from "@/features/portfolio/skills";
import { workflowIntro } from "@/features/portfolio/workflow";

export async function generateMetadata(): Promise<Metadata> {
  const [profile, experiences] = await Promise.all([getProfile(), getExperiences()]);
  // Experiences come newest first, so the first one is the current role.
  return portfolioMetadata(profile, experiences[0]?.role);
}

export default async function HomePage() {
  const [profile, experiences, products, industries, skills, caseStudies, workflow, currentMonth] =
    await Promise.all([
      getProfile(),
      getExperiences(),
      getProducts(),
      getIndustries(),
      getSkills(),
      getCaseStudies(),
      getWorkflow(),
      getCurrentMonth(),
    ]);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <Hero profile={profile} />
      <Highlights cards={highlightCards(experiences)} />
      <Experience
        experiences={experiences}
        products={products}
        industries={industries}
        skills={skills}
        currentMonth={currentMonth}
      />
      <Skills groups={skillGroups(skills, experiences, currentMonth)} />
      <CaseStudies cards={caseStudyCards(caseStudies, experiences, skills)} />
      <HowIWork intro={workflowIntro(profile.summary)} steps={workflow} />
    </div>
  );
}
