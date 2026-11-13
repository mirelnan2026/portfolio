import type { Metadata } from "next";
import { caseStudyCards } from "@/features/portfolio/case-studies";
import { CaseStudies } from "@/features/portfolio/components/case-studies";
import { EducationAndLanguages } from "@/features/portfolio/components/education-languages";
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
  getEducation,
  getExperiences,
  getIndustries,
  getLanguages,
  getProducts,
  getProfile,
  getSkills,
  getWorkflow,
} from "@/features/portfolio/queries";
import { skillGroups, topSkills } from "@/features/portfolio/skills";
import { jsonLdText, profilePageJsonLd } from "@/features/portfolio/structured-data";
import { workflowIntro } from "@/features/portfolio/workflow";
import { siteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const [profile, experiences] = await Promise.all([getProfile(), getExperiences()]);
  // Experiences come newest first, so the first one is the current role.
  return portfolioMetadata(profile, experiences[0]?.role);
}

export default async function HomePage() {
  const [
    profile,
    experiences,
    products,
    industries,
    skills,
    caseStudies,
    workflow,
    education,
    languages,
    currentMonth,
  ] = await Promise.all([
    getProfile(),
    getExperiences(),
    getProducts(),
    getIndustries(),
    getSkills(),
    getCaseStudies(),
    getWorkflow(),
    getEducation(),
    getLanguages(),
    getCurrentMonth(),
  ]);

  const groups = skillGroups(skills, experiences, currentMonth);
  const top = topSkills(groups, skills, 12);
  const [role = profile.headline] = profile.headline.split(" · ");
  const jsonLd = profilePageJsonLd({
    profile,
    role,
    knowsAbout: [...top.map((skill) => skill.name), ...profile.competencies],
    education,
    url: siteUrl,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      {/* Structured data for search and AI: our own records, with "<" escaped (see jsonLdText). */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(jsonLd) }} />

      <Hero profile={profile} />
      <Highlights cards={highlightCards(experiences)} />
      <Experience
        experiences={experiences}
        products={products}
        industries={industries}
        skills={skills}
        currentMonth={currentMonth}
      />
      <Skills groups={groups} top={top} />
      <CaseStudies cards={caseStudyCards(caseStudies, experiences, skills)} />
      <HowIWork intro={workflowIntro(profile.summary)} steps={workflow} />
      <EducationAndLanguages education={education} languages={languages} />
    </div>
  );
}
