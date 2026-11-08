import { migrate } from "drizzle-orm/node-postgres/migrator";
import { connectToPostgres } from "../client";
import { readAdminDatabaseUrl } from "./admin-env";

// `pnpm --filter @mirelnan/db db:migrate`: applies the migrations not applied yet, in order.
const connection = connectToPostgres(readAdminDatabaseUrl(process.env));
try {
  await migrate(connection.db, { migrationsFolder: "./migrations" });
  console.log("Migrations applied.");
} finally {
  await connection.close();
}
