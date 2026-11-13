import type { Industry, Product } from "@mirelnan/domain";

/** A public product a role worked on, in one line: its industry and its name, linked to its public page. */
export function ProductNote({ product, industry }: { product: Product; industry?: Industry }) {
  return (
    <p className="font-mono text-xs text-muted-foreground">
      Product{industry === undefined ? "" : ` · ${industry.name}`} ·{" "}
      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-sans text-sm font-medium text-foreground underline underline-offset-4"
      >
        {product.name} <span aria-hidden="true">↗</span>
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </p>
  );
}
