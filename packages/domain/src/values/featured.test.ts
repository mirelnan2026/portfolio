import { describe, expect, it } from "vitest";
import { featuredSchema } from "./featured";

describe("featuredSchema", () => {
  it("accepts a title with a rank from 1", () => {
    expect(featuredSchema.safeParse({ title: "Shared frontend foundation", rank: 1 }).success).toBe(
      true,
    );
  });

  it.each([0, -1, 1.5])("rejects the rank %d", (rank) => {
    expect(featuredSchema.safeParse({ title: "A card", rank }).success).toBe(false);
  });
});
