import { sql } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../database";
import { createTestDatabase } from "../test-database";
import { generateReaderPassword, readerRole, setUpReaderRole, toReaderUrl } from "./reader-role";

let db: Database;

beforeAll(async () => {
  db = await createTestDatabase();
  await setUpReaderRole(db, generateReaderPassword());
});

/** The public tables for which the reader has (or lacks) the given privilege. */
async function tablesWhereReader(privilege: string, has: boolean): Promise<unknown[]> {
  const result = await db.execute(sql`
    select tablename from pg_tables
    where schemaname = 'public'
      and has_table_privilege(${readerRole}, format('%I.%I', schemaname, tablename), ${privilege}) = ${has}
  `);
  // `Database` is driver-independent, so a raw result is `unknown`; every Postgres driver returns `rows`.
  return (result as { rows: unknown[] }).rows;
}

describe("reader role, on Postgres", () => {
  it("can read every table and change none", async () => {
    expect(await tablesWhereReader("SELECT", false)).toEqual([]);
    expect(await tablesWhereReader("INSERT, UPDATE, DELETE, TRUNCATE", true)).toEqual([]);
  });

  it("is refused when it writes", async () => {
    await db.execute(sql.raw(`SET ROLE ${readerRole}`));
    try {
      await expect(
        db.execute(sql`insert into industries (slug, name) values ('x', 'X')`),
      ).rejects.toMatchObject({ cause: { code: "42501" } }); // insufficient_privilege
    } finally {
      await db.execute(sql`RESET ROLE`);
    }
  });

  it("can read a table that a later migration creates", async () => {
    await db.execute(sql`create table later_table (id integer)`);
    expect(await tablesWhereReader("SELECT", false)).toEqual([]);
  });

  it("gets a new password when set up again", async () => {
    await expect(setUpReaderRole(db, generateReaderPassword())).resolves.toBeUndefined();
  });

  it("rejects a password that could break out of the SQL string", async () => {
    await expect(setUpReaderRole(db, "x'; DROP TABLE experiences; --")).rejects.toThrow(
      "The reader password must be",
    );
  });
});

describe("reader connection details", () => {
  it("generates long, url-safe, different passwords", () => {
    const password = generateReaderPassword();
    expect(password).toMatch(/^[\w-]{43}$/);
    expect(generateReaderPassword()).not.toBe(password);
  });

  it("keeps the host, database and TLS settings and swaps the credentials", () => {
    const admin = "postgresql://owner:old-secret@db.example.com/portfolio?sslmode=verify-full";
    expect(toReaderUrl(admin, "new-secret")).toBe(
      "postgresql://portfolio_reader:new-secret@db.example.com/portfolio?sslmode=verify-full",
    );
  });
});
