import { expect, test } from "@playwright/test";

test("the home page names the owner and links every section", async ({ page, isMobile }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mirel Nan");
  if (isMobile) {
    await page.getByRole("button", { name: "Menu" }).click();
  }
  const nav = page.getByRole("navigation", { name: "Sections" }).last();
  for (const section of [
    "Highlights",
    "Experience",
    "Skills",
    "Case studies",
    "How I work",
    "Education",
  ]) {
    await expect(nav.getByRole("link", { name: section })).toBeVisible();
  }
});

test("a ?skill= link selects the skill and marks the roles that used it", async ({ page }) => {
  await page.goto("/?skill=php");
  await expect(page.getByRole("button", { name: /^PHP/, pressed: true })).toBeVisible();
  await expect(page.locator("#experience-ringier")).toContainText("PHP");
});

test("a skill used only in a personal project shows the project in its panel", async ({ page }) => {
  await page.goto("/?skill=nextjs");
  await expect(page.getByRole("button", { name: /^Next\.js/, pressed: true })).toBeVisible();
  // The panel is an aside on large screens and sits under the skill's group on small ones: one of them is visible.
  // A regex, because a string `hasText` ignores case and would also match the case study ("Personal project · …").
  const project = page
    .getByRole("listitem")
    .filter({ hasText: /mirelnan\.dev · personal project · / })
    .filter({ visible: true });
  await expect(project).toHaveCount(1);
  await expect(project).toContainText("mirelnan.dev");
});

test("every response carries the security headers", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain("default-src 'self'");
  expect(headers["strict-transport-security"]).toContain("max-age=");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
});

test("search engines and AI get the metadata, structured data and llms.txt", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/^Mirel Nan · /);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://mirelnan.dev",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /opengraph-image/,
  );
  const jsonLd: unknown = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}",
  );
  expect(jsonLd).toMatchObject({
    "@type": "ProfilePage",
    mainEntity: { "@type": "Person", name: "Mirel Nan" },
  });
  for (const path of ["/robots.txt", "/sitemap.xml", "/llms.txt"]) {
    expect((await request.get(path)).status()).toBe(200);
  }
});

test("an unknown address is a real 404", async ({ request }) => {
  expect((await request.get("/no-such-page")).status()).toBe(404);
});
