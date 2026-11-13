import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SkipLink } from "@/components/layout/skip-link";
import { getProfile } from "@/features/portfolio/queries";
import { pageSections } from "@/features/portfolio/sections";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

/** What every page inherits: the origin for absolute URLs, and a title for pages without their own (404). */
export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  return {
    // A string, not a URL: cached values must be serialisable.
    metadataBase: siteUrl,
    // A page's own title becomes "<title> · <name>"; the home page sets an absolute one.
    title: { default: `${profile.name} · Portfolio`, template: `%s · ${profile.name}` },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const profile = await getProfile();

  return (
    // next-themes sets the `dark` class on <html> before React hydrates, so the server HTML and the
    // browser DOM differ there on purpose: suppressHydrationWarning silences that one attribute only.
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SkipLink />
          <SiteHeader sections={pageSections} />
          <main id="main">{children}</main>
          <SiteFooter name={profile.name} email={profile.email} linkedinUrl={profile.linkedinUrl} />
        </ThemeProvider>

        {/* Cookieless page views, served first-party from /_vercel/insights (no consent banner needed). */}
        <Analytics />
      </body>
    </html>
  );
}
