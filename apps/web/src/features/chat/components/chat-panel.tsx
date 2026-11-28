"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  canAsk,
  chatRequestBody,
  isConversationFull,
  maxQuestionLength,
  readChatReply,
  type ChatEntry,
  type ChatReply,
} from "../client";
import { chatErrors } from "../messages";

/**
 * "Ask about me": a side sheet (460px, full screen on phones) holding the conversation. The state lives here, outside
 * the sheet's content, so closing and reopening keeps it. Answers are rendered as text, never as HTML.
 */
export function ChatPanel() {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [question, setQuestion] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; restart: boolean } | null>(null);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const fieldId = useId();

  const full = isConversationFull(entries);
  const pending = pendingQuestion !== null;

  async function send() {
    if (pending || full || !canAsk(question)) {
      return;
    }
    const asked = question.trim();
    setPendingQuestion(asked);
    setQuestion("");
    setError(null);
    let reply: ChatReply;
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(chatRequestBody(entries, asked)),
      });
      const body: unknown = await response.json().catch(() => undefined);
      reply = readChatReply(response.status, body);
    } catch {
      // No response at all (offline, aborted): the same generic line as an unreadable one.
      reply = readChatReply(0, undefined);
    }
    setPendingQuestion(null);
    if (reply.ok) {
      const { answer } = reply;
      setEntries((current) => [
        ...current,
        { role: "user", content: asked },
        { role: "assistant", answer },
      ]);
    } else {
      // The question comes back, so the visitor can send it again, unless they have typed a new one meanwhile.
      setQuestion((current) => (current === "" ? asked : current));
      setError({ message: reply.message, restart: reply.restart });
    }
    fieldRef.current?.focus();
  }

  function startOver() {
    setEntries([]);
    setError(null);
    fieldRef.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter is a new line; Enter while an input method composes a word is the composer's.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send();
    }
  }

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>Ask about me</SheetTrigger>
      <SheetContent
        side="right"
        initialFocus={fieldRef}
        className="data-[side=right]:h-dvh data-[side=right]:w-full data-[side=right]:sm:max-w-115 pb-[env(safe-area-inset-bottom)]"
      >
        <SheetHeader>
          <SheetTitle>Ask about me</SheetTitle>
          <SheetDescription>
            An AI assistant answers from Mirel&apos;s CV only. It can make mistakes, so check the
            timeline for anything important.
          </SheetDescription>
        </SheetHeader>

        <div role="log" aria-label="Conversation" className="flex-1 overflow-y-auto px-4">
          <ol className="flex flex-col gap-3 text-base">
            {entries.map((entry, index) => (
              <li
                key={index}
                className={
                  entry.role === "user"
                    ? "self-end rounded-lg bg-muted px-3 py-2 whitespace-pre-line"
                    : "whitespace-pre-line"
                }
              >
                <span className="sr-only">{entry.role === "user" ? "You: " : "Assistant: "}</span>
                {entry.role === "user" ? entry.content : entry.answer.content}
              </li>
            ))}
            {pendingQuestion !== null && (
              <li className="self-end rounded-lg bg-muted px-3 py-2 whitespace-pre-line">
                <span className="sr-only">You: </span>
                {pendingQuestion}
              </li>
            )}
          </ol>
        </div>

        <p role="status" className="px-4 text-muted-foreground">
          {pending ? "Thinking…" : full ? chatErrors.conversationFull : ""}
        </p>

        {error && (
          <p role="alert" className="mx-4 rounded-md border border-input px-3 py-2">
            {error.message}
          </p>
        )}

        <form
          className="flex flex-col gap-2 border-t p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          {/* Hidden from sight, not from assistive technology: the field keeps its accessible name. */}
          <label htmlFor={fieldId} className="sr-only">
            Your question
          </label>
          <textarea
            id={fieldId}
            ref={fieldRef}
            value={question}
            onChange={(event) => {
              setQuestion(event.target.value);
            }}
            onKeyDown={onKeyDown}
            maxLength={maxQuestionLength}
            rows={3}
            placeholder="Ask about Mirel's roles, skills or case studies"
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-base placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-2">
            {entries.length > 0 && (
              <Button type="button" variant="ghost" onClick={startOver}>
                New conversation
              </Button>
            )}
            <Button
              type="submit"
              className="ml-auto"
              disabled={pending || full || !canAsk(question)}
            >
              Send
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
