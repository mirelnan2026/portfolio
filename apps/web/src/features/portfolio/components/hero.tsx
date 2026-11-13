import type { Profile } from "@mirelnan/domain";
import { cn } from "cn";
import { DownloadIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

/** The CV PDF without the phone number, served from `public/`. */
const cvHref = "/mirel-nan-cv.pdf";

/**
 * The first screen: who, what, where, and the ways to get in touch. Every word comes from the profile;
 * the headline's part after " · " is the differentiator, so it gets the accent.
 */
export function Hero({ profile }: { profile: Profile }) {
  const [role, ...focus] = profile.headline.split(" · ");

  return (
    <section aria-labelledby="hero-title" className="flex max-w-3xl flex-col gap-5 py-16 sm:py-24">
      <p className="inline-flex items-center gap-2 self-start rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
        {profile.availability} · {profile.location}
      </p>
      <h1 id="hero-title" className="text-display font-semibold">
        {profile.name}
      </h1>
      <p className="text-headline">
        {role}
        {focus.length > 0 && (
          <>
            {" · "}
            <span className="text-brand">{focus.join(" · ")}</span>
          </>
        )}
      </p>
      <p className="max-w-[42rem] text-muted-foreground">{profile.intro}</p>
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <a href={cvHref} download className={cn(buttonVariants({ size: "lg" }))}>
          <DownloadIcon aria-hidden="true" />
          Download CV <span className="sr-only">(PDF)</span>
        </a>
        <a
          href={profile.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          LinkedIn <span aria-hidden="true">↗</span>
          <span className="sr-only">(opens in a new tab)</span>
        </a>
        <a
          href={`mailto:${profile.email}`}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          Email
        </a>
      </div>
    </section>
  );
}
