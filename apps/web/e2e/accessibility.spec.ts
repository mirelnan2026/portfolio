import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** The WCAG 2.0, 2.1 and 2.2 rules at levels A and AA. */
const wcagAA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/**
 * Every page, plus states that show hidden content: a selected skill opens its panel and "Earlier experience";
 * one used only in a personal project (`nextjs`) opens "Show all" and lists the project.
 */
const pages = ["/", "/?skill=php", "/?skill=nextjs", "/accessibility", "/no-such-page"];

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

/**
 * The chat panel's states, each checked by axe: open and empty, with an answer, and with an error. `/api/chat` is
 * faked (see chat.spec.ts), so the check needs no API key. Needs a build with CHAT_ENABLED=true.
 */
const chatStates = {
  open: undefined,
  answered: {
    status: 200,
    json: {
      answer: {
        role: "assistant",
        conversationId: "3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f",
        content: "Mirel's most recent role was Senior Frontend Engineer at JWP Connatix.",
        tools: ["list_experiences"],
        position: 1,
        issuedAt: "2026-11-26T10:00:00.000Z",
        expiresAt: "2026-11-26T10:15:00.000Z",
        signature: "a".repeat(64),
      },
    },
  },
  error: { status: 429, json: { error: "Too many requests. Try again later." } },
} as const;

for (const [state, reply] of Object.entries(chatStates)) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`the chat panel (${state}) meets WCAG 2.2 AA in ${colorScheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      if (reply) {
        await page.route("**/api/chat", (route) => route.fulfill(reply));
      }
      await page.goto("/");
      await page.getByRole("button", { name: "Ask about me" }).click();
      const dialog = page.getByRole("dialog", { name: "Ask about me" });
      await expect(dialog).toBeVisible();
      if (reply) {
        await dialog.getByRole("textbox", { name: "Your question" }).fill("Where does Mirel work?");
        await dialog.getByRole("button", { name: "Send" }).click();
        await expect(
          state === "error"
            ? dialog.getByRole("alert")
            : dialog.getByRole("log", { name: "Conversation" }),
        ).toContainText(state === "error" ? "Too many requests" : "most recent role");
      }
      const { violations } = await new AxeBuilder({ page }).withTags(wcagAA).analyze();
      expect(
        violations.map((violation) => ({
          rule: violation.id,
          elements: violation.nodes.map((node) => node.target.join(" ")),
        })),
      ).toEqual([]);
    });
  }
}
