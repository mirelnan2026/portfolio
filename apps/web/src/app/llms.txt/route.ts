import { llmsTxt } from "@/features/portfolio/llms";
import {
  getCaseStudies,
  getCurrentMonth,
  getEducation,
  getExperiences,
  getLanguages,
  getProfile,
  getSkills,
  getWorkflow,
} from "@/features/portfolio/queries";
import { skillGroups, topSkills } from "@/features/portfolio/skills";
import { siteUrl } from "@/lib/site";

/** /llms.txt, built from the same cached reads as the page, so it is prerendered and cannot drift from it. */
export async function GET() {
  const [profile, experiences, skills, caseStudies, workflow, education, languages, currentMonth] =
    await Promise.all([
      getProfile(),
      getExperiences(),
      getSkills(),
      getCaseStudies(),
      getWorkflow(),
      getEducation(),
      getLanguages(),
      getCurrentMonth(),
    ]);
  const text = llmsTxt({
    profile,
    experiences,
    skills: topSkills(skillGroups(skills, experiences, currentMonth), skills, 12),
    caseStudies,
    workflow,
    education,
    languages,
    url: siteUrl,
  });
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
