import { getProfile } from "@/features/portfolio/queries";

export default async function HomePage() {
  const profile = await getProfile();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">{profile.name}</h1>
      <p className="mt-2 text-lg text-muted-foreground">{profile.headline}</p>
    </div>
  );
}
