import type { Product } from "../entities/product";

export interface ProductRepository {
  /** All products. Site context only: the AI layer never receives this repository. */
  list(): Promise<Product[]>;
}
