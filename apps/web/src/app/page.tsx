import type { Metadata } from "next";
import { Hero } from "@/features/portfolio/components/hero";
import { portfolioMetadata } from "@/features/portfolio/metadata";
import { getProfile } from "@/features/portfolio/queries";

export async function generateMetadata(): Promise<Metadata> {
  return portfolioMetadata(await getProfile());
}

export default async function HomePage() {
  const profile = await getProfile();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <Hero profile={profile} />
    </div>
  );
}
