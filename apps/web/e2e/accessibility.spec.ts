import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** The WCAG 2.0, 2.1 and 2.2 rules at levels A and AA. */
const wcagAA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** Every page, plus states that show hidden content: a selected skill opens its panel and "Earlier experience". */
const pages = ["/", "/?skill=php", "/accessibility", "/no-such-page"];

for (const path of pages) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`${path} meets WCAG 2.2 AA in ${colorScheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto(path);
      const { violations } = await new AxeBuilder({ page }).withTags(wcagAA).analyze();
      // Rule ids and the elements they hit, so a failure says what to fix.
      expect(
        violations.map((violation) => ({
          rule: violation.id,
          elements: violation.nodes.map((node) => node.target.join(" ")),
        })),
      ).toEqual([]);
    });
  }
}
