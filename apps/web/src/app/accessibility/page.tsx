import type { Metadata } from "next";
import { getProfile } from "@/features/portfolio/queries";

export const metadata: Metadata = {
  title: "Accessibility statement",
  description: "How this site meets WCAG 2.2 AA, how that is checked, and how to report a barrier.",
  alternates: { canonical: "/accessibility" },
};

/** What the site aims for, how it is checked (only checks that really run), and how to report a barrier. */
export default async function AccessibilityPage() {
  const profile = await getProfile();

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-16 sm:px-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Accessibility statement</h1>
        <p className="text-muted-foreground">
          This site aims to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA, in
          the light and the dark theme, on desktop and on phones.
        </p>
      </header>

      <section aria-labelledby="checks-title" className="flex flex-col gap-3">
        <h2 id="checks-title" className="text-xl font-semibold tracking-tight">
          How it is checked
        </h2>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            Every change runs automated WCAG 2.2 AA checks (axe) on every page, in both themes, at
            desktop and phone sizes, and is not released while any of them fails.
          </li>
          <li>The code is linted for accessibility errors (jsx-a11y, strict) on every commit.</li>
          <li>
            A test computes the contrast of every colour pair the design uses, in both themes: at
            least 4.5:1 for text and 3:1 for focus outlines and input borders.
          </li>
          <li>
            Everything works with the keyboard alone, and the focus outline is always visible.
          </li>
          <li>
            The site follows your system settings for dark mode, reduced motion and higher contrast.
          </li>
        </ul>
      </section>

      <section aria-labelledby="report-title" className="flex flex-col gap-3">
        <h2 id="report-title" className="text-xl font-semibold tracking-tight">
          Report a barrier
        </h2>
        <p>
          If something on this site is hard or impossible to use, please write to{" "}
          <a href={`mailto:${profile.email}`} className="underline underline-offset-4">
            {profile.email}
          </a>
          , saying which page and what happened. I will reply within a week.
        </p>
      </section>
    </article>
  );
}
