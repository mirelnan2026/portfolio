import type { Education, Profile } from "@mirelnan/domain";

export interface ProfilePageInput {
  profile: Profile;
  /** "Senior Frontend Engineer", the headline's role. */
  role: string;
  /** The top skills and the profile's broad competencies. */
  knowsAbout: string[];
  education: Education[];
  /** The page's canonical URL. */
  url: string;
}

/** A schema.org ProfilePage whose main entity is the owner, built from the data only. */
export function profilePageJsonLd({ profile, role, knowsAbout, education, url }: ProfilePageInput) {
  const [locality, country] = profile.location.split(", ");
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url,
    mainEntity: {
      "@type": "Person",
      name: profile.name,
      jobTitle: role,
      description: profile.intro,
      url,
      sameAs: [profile.linkedinUrl],
      address: { "@type": "PostalAddress", addressLocality: locality, addressCountry: country },
      knowsAbout,
      alumniOf: education.map((entry) => ({
        "@type": "CollegeOrUniversity",
        name: entry.institution,
      })),
    },
  };
}

/** JSON for an inline `<script>`: "<" is escaped, so no value can close the tag and inject HTML. */
export function jsonLdText(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
