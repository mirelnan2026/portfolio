import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";

// Replaces Next's default 404, which adds a second <title>; Next still sends the 404 status and noindex.
export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 px-4 py-24 sm:px-6">
      <h1 className="text-headline font-semibold">Page not found</h1>
      <p className="text-muted-foreground">There is no page at this address.</p>
      <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
        Back to the portfolio
      </Link>
    </div>
  );
}
