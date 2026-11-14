import Link from "next/link";

/** The site's contact line: the email address and LinkedIn, from the profile, and the accessibility statement. */
export function SiteFooter({
  name,
  email,
  linkedinUrl,
}: {
  name: string;
  email: string;
  linkedinUrl: string;
}) {
  return (
    <footer id="contact" className="border-t">
      <div className="mx-auto flex max-w-5xl flex-wrap items-baseline justify-between gap-x-8 gap-y-3 px-4 py-10 sm:px-6">
        <p className="font-semibold tracking-tight">{name}</p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <li>
            <a href={`mailto:${email}`} className="underline underline-offset-4">
              {email}
            </a>
          </li>
          <li>
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              LinkedIn <span aria-hidden="true">↗</span>
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
          <li>
            <Link href="/accessibility" className="underline underline-offset-4">
              Accessibility
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
