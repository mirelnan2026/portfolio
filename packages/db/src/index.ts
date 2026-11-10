// The public API of @mirelnan/db. Tables and database ids stay inside: consumers get domain types.
export { connectToPostgres, type PostgresConnection } from "./client";
export type { Database } from "./database";
export { createDrizzleRepositories } from "./repositories/drizzle-repositories";
