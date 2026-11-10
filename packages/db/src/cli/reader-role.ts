import { randomBytes } from "node:crypto";
import { sql } from "drizzle-orm";
import type { Database } from "../database";

/** The Postgres role the web app connects as: it can read the public tables and nothing else. */
export const readerRole = "portfolio_reader";

/** 256 random bits in base64url (letters, digits, `-`, `_`): safe inside a SQL string literal. */
export function generateReaderPassword(): string {
  return randomBytes(32).toString("base64url");
}

const safePassword = /^[\w-]{32,}$/;

/**
 * Creates the reader role, or gives it a new password if it exists (so running it again rotates the
 * password), then grants read access to every table in `public`, now and after future migrations.
 * One DO block, so it all happens or nothing does.
 */
export async function setUpReaderRole(db: Database, password: string): Promise<void> {
  // CREATE ROLE takes no bind parameters, so the password is checked before it goes into the SQL text.
  if (!safePassword.test(password)) {
    throw new Error("The reader password must be at least 32 letters, digits, '-' or '_'.");
  }
  await db.execute(
    sql.raw(`
      DO $$
      BEGIN
        IF EXISTS (SELECT FROM pg_roles WHERE rolname = '${readerRole}') THEN
          ALTER ROLE ${readerRole} WITH LOGIN PASSWORD '${password}';
        ELSE
          CREATE ROLE ${readerRole} WITH LOGIN PASSWORD '${password}';
        END IF;
        EXECUTE format('GRANT CONNECT ON DATABASE %I TO ${readerRole}', current_database());
        GRANT USAGE ON SCHEMA public TO ${readerRole};
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${readerRole};
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO ${readerRole};
      END
      $$
    `),
  );
}

/** The admin connection string with the reader's name and password: same host, database and TLS. */
export function toReaderUrl(adminUrl: string, password: string): string {
  const url = new URL(adminUrl);
  url.username = readerRole;
  url.password = password;
  return url.toString();
}
