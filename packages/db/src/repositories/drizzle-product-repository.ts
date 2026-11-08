import type { ProductRepository } from "@mirelnan/domain";
import { asc, eq } from "drizzle-orm";
import type { Database } from "../database";
import { industries, products } from "../schema";

export function createDrizzleProductRepository(db: Database): ProductRepository {
  return {
    list: () =>
      db
        .select({
          slug: products.slug,
          name: products.name,
          url: products.url,
          description: products.description,
          industrySlug: industries.slug,
          sourceUrl: products.sourceUrl,
          retrievedOn: products.retrievedOn,
        })
        .from(products)
        .innerJoin(industries, eq(products.industryId, industries.id))
        .orderBy(asc(products.id)),
  };
}
