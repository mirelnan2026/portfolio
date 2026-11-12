import type { Metadata } from "next";
import { Hero } from "@/features/portfolio/components/hero";
import { Highlights } from "@/features/portfolio/components/highlights";
import { highlightCards } from "@/features/portfolio/highlights";
import { portfolioMetadata } from "@/features/portfolio/metadata";
import { getExperiences, getProfile } from "@/features/portfolio/queries";

export async function generateMetadata(): Promise<Metadata> {
  return portfolioMetadata(await getProfile());
}

export default async function HomePage() {
  const [profile, experiences] = await Promise.all([getProfile(), getExperiences()]);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <Hero profile={profile} />
      <Highlights cards={highlightCards(experiences)} />
    </div>
  );
}
