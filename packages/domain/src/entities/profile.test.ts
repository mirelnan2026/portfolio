import { describe, expect, it } from "vitest";
import { profileSchema } from "./profile";

const profile = {
  name: "Jane Doe",
  headline: "Frontend Engineer",
  summary: "Builds web applications.",
  location: "Bucharest, Romania",
  availability: "Open to remote",
  email: "jane@example.com",
  linkedinUrl: "https://www.linkedin.com/in/jane-doe",
  interests: ["chess"],
  sourceSlug: "cv",
};

describe("profileSchema", () => {
  it("accepts a valid profile", () => {
    expect(profileSchema.safeParse(profile).success).toBe(true);
  });

  it("rejects unknown keys, so a phone number cannot slip in", () => {
    const result = profileSchema.safeParse({ ...profile, phone: "+40 700 000 000" });
    expect(result.success).toBe(false);
  });

  it.each(["javascript:alert(1)", "http://www.linkedin.com/in/jane-doe", "not a url"])(
    "rejects the link %j",
    (linkedinUrl) => {
      expect(profileSchema.safeParse({ ...profile, linkedinUrl }).success).toBe(false);
    },
  );

  it("rejects an invalid email", () => {
    expect(profileSchema.safeParse({ ...profile, email: "jane" }).success).toBe(false);
  });

  it("rejects a sourceSlug that is not a slug", () => {
    expect(profileSchema.safeParse({ ...profile, sourceSlug: "My CV" }).success).toBe(false);
  });
});
