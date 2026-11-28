import { expect, test, type Page, type Route } from "@playwright/test";

/**
 * The chat panel, against the production build with CHAT_ENABLED=true (CI and previews). `/api/chat` is replaced by
 * a fake in every test: the browser's side is under test, never the model, so CI needs no API key and spends nothing.
 */

/** A signed answer as the route returns it; the browser must send it back untouched. */
const signedAnswer = (content: string, position: number) => ({
  role: "assistant",
  conversationId: "3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f",
  content,
  tools: ["list_experiences"],
  position,
  issuedAt: "2026-11-26T10:00:00.000Z",
  expiresAt: "2026-11-26T10:15:00.000Z",
  signature: "a".repeat(64),
});

const firstAnswer = signedAnswer(
  "Mirel's most recent role was Senior Frontend Engineer at JWP Connatix.",
  1,
);

/** Answers every chat request with `reply`, and records the bodies the page sent. */
async function fakeChat(
  page: Page,
  reply: (body: { messages: unknown[] }) => { status: number; json: unknown },
): Promise<{ messages: unknown[] }[]> {
  const sent: { messages: unknown[] }[] = [];
  await page.route("**/api/chat", async (route: Route) => {
    const body = route.request().postDataJSON() as { messages: unknown[] };
    sent.push(body);
    const { status, json } = reply(body);
    await route.fulfill({ status, json });
  });
  return sent;
}

async function openChat(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Ask about me" }).click();
  return page.getByRole("dialog", { name: "Ask about me" });
}

async function ask(page: Page, question: string) {
  const dialog = page.getByRole("dialog", { name: "Ask about me" });
  await dialog.getByRole("textbox", { name: "Your question" }).fill(question);
  await dialog.getByRole("button", { name: "Send" }).click();
}

test("opens from the header, moves focus to the question field, and closes with Escape", async ({
  page,
}) => {
  const dialog = await openChat(page);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("textbox", { name: "Your question" })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  // Focus goes back to what opened the panel (WCAG 2.4.3).
  await expect(page.getByRole("button", { name: "Ask about me" })).toBeFocused();
});

test("shows the question and the answer in the conversation log", async ({ page }) => {
  await fakeChat(page, () => ({ status: 200, json: { answer: firstAnswer } }));
  const dialog = await openChat(page);

  await ask(page, "Where does Mirel work?");

  const log = dialog.getByRole("log", { name: "Conversation" });
  await expect(log).toContainText("Where does Mirel work?");
  await expect(log).toContainText("most recent role was Senior Frontend Engineer");
  // The field is emptied and ready for the next question.
  await expect(dialog.getByRole("textbox", { name: "Your question" })).toHaveValue("");
});

test("sends the signed answer back unchanged with the next question", async ({ page }) => {
  const sent = await fakeChat(page, (body) => ({
    status: 200,
    json: { answer: signedAnswer("He worked there from March 2023.", body.messages.length) },
  }));
  await openChat(page);

  await ask(page, "Where does Mirel work?");
  await expect(page.getByRole("log", { name: "Conversation" })).toContainText(
    "He worked there from March 2023.",
  );
  await ask(page, "Since when?");
  await expect.poll(() => sent.length).toBe(2);

  expect(sent[1]).toEqual({
    messages: [
      { role: "user", content: "Where does Mirel work?" },
      signedAnswer("He worked there from March 2023.", 1),
      { role: "user", content: "Since when?" },
    ],
  });
});

test("says it is thinking while the answer is on its way, and lets the visitor send nothing meanwhile", async ({
  page,
}) => {
  let release: () => void = () => undefined;
  const answered = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/chat", async (route) => {
    await answered;
    await route.fulfill({ status: 200, json: { answer: firstAnswer } });
  });
  const dialog = await openChat(page);

  await ask(page, "Where does Mirel work?");
  await expect(dialog.getByRole("status")).toHaveText(/thinking/i);
  await expect(dialog.getByRole("button", { name: "Send" })).toBeDisabled();
  // The question leaves the field as soon as it is sent: it is already in the conversation.
  await expect(dialog.getByRole("textbox", { name: "Your question" })).toHaveValue("");
  await expect(dialog.getByRole("log", { name: "Conversation" })).toContainText(
    "Where does Mirel work?",
  );

  release();
  await expect(dialog.getByRole("log", { name: "Conversation" })).toContainText(
    firstAnswer.content,
  );
  // The status region stays in the page, emptied, so the next "Thinking…" is announced too.
  await expect(dialog.getByRole("status")).toHaveText("");
  // The field is still empty, so Send waits for the next question.
  await expect(dialog.getByRole("button", { name: "Send" })).toBeDisabled();
  await dialog.getByRole("textbox", { name: "Your question" }).fill("And before that?");
  await expect(dialog.getByRole("button", { name: "Send" })).toBeEnabled();
});

test("renders the model's text as text, never as markup", async ({ page }) => {
  const markup = "<img src=x onerror=\"document.title='pwned'\"><b>bold</b>";
  await fakeChat(page, () => ({ status: 200, json: { answer: signedAnswer(markup, 1) } }));
  const dialog = await openChat(page);

  await ask(page, "Say something");

  await expect(dialog.getByRole("log", { name: "Conversation" })).toContainText(markup);
  await expect(dialog.locator("img")).toHaveCount(0);
  await expect(page).not.toHaveTitle("pwned");
});

test("shows the server's line when the visitor asks too often, as an alert", async ({ page }) => {
  await fakeChat(page, () => ({
    status: 429,
    json: { error: "Too many requests. Try again later." },
  }));
  const dialog = await openChat(page);

  await ask(page, "Where does Mirel work?");

  await expect(dialog.getByRole("alert")).toHaveText("Too many requests. Try again later.");
  // The question comes back to the field, so the visitor can send it again later.
  await expect(dialog.getByRole("textbox", { name: "Your question" })).toHaveValue(
    "Where does Mirel work?",
  );
});

test("keeps what the visitor typed while waiting when the question fails", async ({ page }) => {
  let release: () => void = () => undefined;
  const answered = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/chat", async (route) => {
    await answered;
    await route.fulfill({ status: 429, json: { error: "Too many requests. Try again later." } });
  });
  const dialog = await openChat(page);
  const field = dialog.getByRole("textbox", { name: "Your question" });

  await ask(page, "Where does Mirel work?");
  await field.fill("And before that?");
  release();

  await expect(dialog.getByRole("alert")).toHaveText("Too many requests. Try again later.");
  // The failed question does not overwrite the new one.
  await expect(field).toHaveValue("And before that?");
});

test("shows a generic line when the network fails", async ({ page }) => {
  await page.route("**/api/chat", (route) => route.abort("failed"));
  const dialog = await openChat(page);

  await ask(page, "Where does Mirel work?");

  await expect(dialog.getByRole("alert")).toHaveText(
    "The chat is unavailable right now. Try again later.",
  );
});

test("offers a new conversation when the server says this one can no longer continue", async ({
  page,
}) => {
  let calls = 0;
  await fakeChat(page, () => {
    calls++;
    return calls === 1
      ? { status: 200, json: { answer: firstAnswer } }
      : {
          status: 400,
          json: { error: "This conversation can no longer continue. Start a new one." },
        };
  });
  const dialog = await openChat(page);
  await ask(page, "Where does Mirel work?");
  await expect(dialog.getByRole("log", { name: "Conversation" })).toContainText("most recent role");
  await ask(page, "Since when?");

  await dialog.getByRole("button", { name: "New conversation" }).click();

  await expect(dialog.getByRole("log", { name: "Conversation" })).not.toContainText(
    "most recent role",
  );
  await expect(dialog.getByRole("alert")).toBeHidden();
  await expect(dialog.getByRole("textbox", { name: "Your question" })).toBeFocused();
});

test("does not send an empty question", async ({ page }) => {
  const sent = await fakeChat(page, () => ({ status: 200, json: { answer: firstAnswer } }));
  const dialog = await openChat(page);

  await dialog.getByRole("textbox", { name: "Your question" }).fill("   ");

  await expect(dialog.getByRole("button", { name: "Send" })).toBeDisabled();
  expect(sent).toHaveLength(0);
});

test("sends with Enter and keeps Shift+Enter for a new line", async ({ page }) => {
  const sent = await fakeChat(page, () => ({ status: 200, json: { answer: firstAnswer } }));
  const dialog = await openChat(page);
  const field = dialog.getByRole("textbox", { name: "Your question" });

  await field.fill("Where does");
  await field.press("Shift+Enter");
  await field.pressSequentially("Mirel work?");
  await field.press("Enter");

  await expect.poll(() => sent.length).toBe(1);
  expect(sent[0]?.messages).toEqual([{ role: "user", content: "Where does\nMirel work?" }]);
});
