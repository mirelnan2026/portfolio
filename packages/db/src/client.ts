import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as tables from "./schema";

export interface PostgresConnection {
  db: NodePgDatabase<typeof tables>;
  /** Closes the pool, so a script can exit. */
  close: () => Promise<void>;
}

/**
 * A Drizzle database over TCP (node-postgres), the driver Neon recommends for Node.js and for Vercel's
 * Fluid compute. The caller owns the connection and closes it when done.
 */
export function connectToPostgres(url: string): PostgresConnection {
  const pool = new Pool({ connectionString: url });
  const db = drizzle({ client: pool, schema: tables, casing: "snake_case" });
  return { db, close: () => pool.end() };
}
