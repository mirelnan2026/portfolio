import { writeFile } from "node:fs/promises";
import { sql } from "drizzle-orm";
import { connectToPostgres } from "../client";
import { readAdminDatabaseUrl } from "./admin-env";
import { generateReaderPassword, readerRole, setUpReaderRole, toReaderUrl } from "./reader-role";

// `pnpm --filter @mirelnan/db db:reader`: creates the reader role (or rotates its password), checks that
// it can log in and read, then writes its connection string to a git-ignored file, not to the terminal.
const adminUrl = readAdminDatabaseUrl(process.env);
const password = generateReaderPassword();

const admin = connectToPostgres(adminUrl);
try {
  await setUpReaderRole(admin.db, password);
} finally {
  await admin.close();
}

const readerUrl = toReaderUrl(adminUrl, password);
const reader = connectToPostgres(readerUrl);
try {
  await reader.db.execute(sql`select 1 from experiences limit 1`);
} finally {
  await reader.close();
}

await writeFile(".env.reader.local", `DATABASE_URL=${readerUrl}\n`, { mode: 0o600 });
console.log(
  `${readerRole} logged in and read the data. Its connection string is in packages/db/.env.reader.local.`,
);
