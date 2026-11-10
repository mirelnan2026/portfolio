import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      {/* Moves into the header at step 4d. */}
      <div className="flex justify-end">
        <ThemeToggle />
      </div>
      <h1 className="text-4xl font-semibold tracking-tight">Mirel Nan</h1>
      <p className="mt-2 text-lg text-muted-foreground">Senior Frontend Engineer</p>
    </main>
  );
}
