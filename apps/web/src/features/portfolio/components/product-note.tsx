import type { Industry, Product } from "@mirelnan/domain";

/** A public product a role worked on: context only, named and described as its public page does. */
export function ProductNote({ product, industry }: { product: Product; industry?: Industry }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border bg-card px-3.5 py-3">
      <p className="font-mono text-xs text-muted-foreground">
        Product{industry === undefined ? "" : ` · ${industry.name}`}
      </p>
      <p className="text-sm">
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline underline-offset-4"
        >
          {product.name} <span aria-hidden="true">↗</span>
          <span className="sr-only">(opens in a new tab)</span>
        </a>{" "}
        — {product.description}
      </p>
    </div>
  );
}
