import "server-only";
import { connectToPostgres, createDrizzleRepositories } from "@mirelnan/db";
import { attachDatabasePool } from "@vercel/functions";
import { readServerEnv } from "./env";

// Composition root: the only place that knows which adapters implement the domain ports.
// Module scope, so one pool is shared by every request an instance serves (Vercel Fluid compute).
const env = readServerEnv(process.env);
const connection = connectToPostgres(env.DATABASE_URL);

// Releases idle connections before Vercel suspends the instance; does nothing outside Vercel.
attachDatabasePool(connection.pool);

export const repositories = createDrizzleRepositories(connection.db);
