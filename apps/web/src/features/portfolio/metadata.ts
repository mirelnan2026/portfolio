import type { Profile } from "@mirelnan/domain";
import type { Metadata } from "next";
import { sentences } from "./format";

/** Search engines cut longer titles and descriptions. */
export const titleMaxLength = 60;
export const descriptionMaxLength = 160;

/**
 * The home page's metadata, from the data only. The title is the name and the current role, which names the
 * main stack ("Senior Frontend Engineer (Angular, React)"); the description is the headline's role and the
 * intro's second sentence, the one with the stack. Too long a value fails the build, instead of being cut
 * mid-word by the search engine.
 */
export function portfolioMetadata(profile: Profile, currentRole: string | undefined): Metadata {
  const [role = profile.headline] = profile.headline.split(" · ");
  const title = `${profile.name} · ${currentRole ?? role}`;
  const [first = "", second] = sentences(profile.intro);
  const description = `${role}. ${second ?? first}`;
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
