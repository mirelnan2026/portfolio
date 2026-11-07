import { date, integer, text } from "drizzle-orm/pg-core";

/**
 * Column helpers shared by every table. Each call returns a new builder,
 * so two tables never share a column object.
 */

/** Surrogate key: an integer the database assigns. The domain never sees it; it uses the slug. */
export const id = () => integer().primaryKey().generatedAlwaysAsIdentity();

/** The domain identity of a row, e.g. "jwp-connatix". */
export const slug = () => text().notNull();

/** Display order inside the parent list, starting at 0 (the index in `cv-data`). */
export const position = () => integer().notNull();

/**
 * A month from the domain ("2023-03"), stored as its first day ("2023-03-01").
 * A `date` column sorts and compares correctly, and Postgres rejects an invalid day.
 */
export const month = () => date({ mode: "string" });
