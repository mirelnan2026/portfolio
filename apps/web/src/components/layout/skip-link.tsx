/**
 * The first focusable element on every page (WCAG 2.4.1): hidden until it receives keyboard focus,
 * then it jumps over the header to the main content.
 */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only rounded-md bg-background text-sm font-medium focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-2"
    >
      Skip to content
    </a>
  );
}
