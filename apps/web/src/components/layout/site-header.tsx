import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

/**
 * Sticky header. Its height is the `--header-height` token, which globals.css also uses as the scroll
 * padding, so anchors and focused elements never end up hidden behind it (WCAG 2.4.11).
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur contrast-more:bg-background">
      <div className="mx-auto flex h-(--header-height) max-w-5xl items-center justify-between px-4">
        <Link href="/" className="rounded-sm font-semibold tracking-tight">
          Mirel Nan
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
