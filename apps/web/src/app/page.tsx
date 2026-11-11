import { Hero } from "@/features/portfolio/components/hero";
import { getProfile } from "@/features/portfolio/queries";

export default async function HomePage() {
  const profile = await getProfile();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <Hero profile={profile} />
    </div>
  );
}
