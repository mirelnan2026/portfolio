import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Database } from "./database";
import * as tables from "./schema";

/**
 * A new in-memory Postgres with every migration applied: real SQL and real constraints,
 * with no server and no network. Each test file creates its own, so files never share rows.
 */
export async function createTestDatabase(): Promise<Database> {
  const db = drizzle({ client: new PGlite(), schema: tables, casing: "snake_case" });
  await migrate(db, { migrationsFolder: "./migrations" });
  return db;
}
