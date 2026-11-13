import type { Metadata } from "next";
import { Experience } from "@/features/portfolio/components/experience";
import { Hero } from "@/features/portfolio/components/hero";
import { Highlights } from "@/features/portfolio/components/highlights";
import { highlightCards } from "@/features/portfolio/highlights";
import { portfolioMetadata } from "@/features/portfolio/metadata";
import {
  getCurrentMonth,
  getExperiences,
  getIndustries,
  getProducts,
  getProfile,
  getSkills,
} from "@/features/portfolio/queries";

export async function generateMetadata(): Promise<Metadata> {
  return portfolioMetadata(await getProfile());
}

export default async function HomePage() {
  const [profile, experiences, products, industries, skills, currentMonth] = await Promise.all([
    getProfile(),
    getExperiences(),
    getProducts(),
    getIndustries(),
    getSkills(),
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
    </div>
  );
}
