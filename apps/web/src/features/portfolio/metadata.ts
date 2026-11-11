import type { Profile } from "@mirelnan/domain";
import type { Metadata } from "next";

/** Search engines cut longer titles and descriptions. */
export const titleMaxLength = 60;
export const descriptionMaxLength = 160;

/** The text up to the first full stop, question or exclamation mark that ends a sentence. */
function firstSentence(text: string): string {
  return /^.*?[.!?](?=\s|$)/s.exec(text)?.[0] ?? text;
}

/**
 * The home page's metadata, from the profile only: "<name> · <role> · Portfolio" and the intro's first
 * sentence. Too long a value fails the build, instead of being cut mid-word by the search engine.
 */
export function portfolioMetadata(profile: Profile): Metadata {
  const [role] = profile.headline.split(" · ");
  const title = `${profile.name} · ${role ?? profile.headline} · Portfolio`;
  const description = firstSentence(profile.intro);
  if (title.length > titleMaxLength) {
    throw new Error(
      `The page title is ${String(title.length)} characters, over ${String(titleMaxLength)}`,
    );
  }
  if (description.length > descriptionMaxLength) {
    throw new Error(
      `The description is ${String(description.length)} characters, over ${String(descriptionMaxLength)}`,
    );
  }
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      url: "/",
      siteName: `${profile.name} · Portfolio`,
      title,
      description,
    },
    twitter: { card: "summary", title, description },
  };
}
