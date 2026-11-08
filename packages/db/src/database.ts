import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "./schema";

/**
 * Any Drizzle Postgres database built with this schema: Neon in production, PGlite in tests.
 * Code that reads or writes takes this type, so it never depends on one driver.
 */
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

/** The `tx` a transaction callback receives. */
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
