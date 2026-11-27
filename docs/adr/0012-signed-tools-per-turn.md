# 0012. Each signed answer names the tools it was written from

- Status: Accepted
- Date: 2026-11-27
- Extends: [0010](0010-signed-chat-turns.md)

## Context

[ADR 0010](0010-signed-chat-turns.md) keeps no conversation on the server: the browser sends the history back, and
every assistant turn is signed. Only `role` and `content` of a verified turn reach the model; the tool calls and
results behind it are not kept, because they are large (a skills list is several kilobytes) and would push the history
past the request limit.

On the preview, a follow-up question made the model "correct" its own first answer: "I stated that his profile lists
him as based in Bucharest, but I had not checked his profile, so that claim was not based on the tools." The first
answer was grounded (the location comes from the profile tool), but on the next turn the model saw the claim without
its evidence, and the rule "answer only from tool results" made it retract a true statement. A visitor sees an
assistant that contradicts itself.

## Decision

- **Every assistant turn carries `tools`: the names of the CV tools that returned data while it was written**,
  distinct and in the order of the first call (`["search_cv", "get_profile"]`), or an empty list when the answer needed
  none. The names come from the server's loop, never from the model's text; a call that failed, such as a tool name
  the model invented, is not evidence and is left out.
- **`tools` is signed with the rest of the turn.** It joins the HMAC input of ADR 0010, so a visitor cannot add a tool
  to an answer to make an invented claim look checked, or remove one. A turn without the field, or with a name that is
  not one of the CV tools, is malformed and dropped, as any other invalid turn.
- **The model sees the evidence as a note at the end of each earlier answer:** `<sources>search_cv, get_profile</sources>`.
  The system prompt says what it means: the answer was written from those tools' results, which are no longer shown;
  keep it unless a new tool result contradicts it, and never write a `<sources>` tag yourself. An answer with an empty
  list gets no note.
- **The server logs each turn's tools, number of model requests and duration**, without the question, the answer or the
  visitor's address, so a report like the one above can be checked against what the loop really did.
- **Measured by an evaluation case with history:** a first answer with its tools, then a follow-up; the reply must not
  retract the first answer.

## Alternatives considered

- **A rule in the prompt only** ("your earlier answers were checked; do not retract them"). Cheapest, but the model
  would trust an answer it cannot verify, including one with no tools behind it, such as a refusal.
- **Send the tool results back, signed.** The model would see everything, but a few turns would exceed the 128 KB
  request limit, and every request would cost more for data the model already summarised.
- **The sources of each claim** (experience and project slugs, source slugs) instead of tool names. Better for the
  source chips the interface will show, but they must be extracted from tool results, which is a separate design; the
  chips get their own field when the interface is built.
- **Keep the conversation on the server.** Rejected by ADR 0010 (storage, retention, personal data).

## Consequences

- (+) A grounded answer stays grounded on the next turn: the model knows which tools it came from.
- (+) The field cannot be forged; an answer written without tools is marked as such.
- (+) The server log shows which tools answered each question, with no personal data.
- (−) A deploy changes the signed fields: conversations open at that moment lose their earlier answers once (they no
  longer verify) and start again, as with a key rotation; the 15-minute expiry bounds this.
- (−) A few more bytes per turn, and a tag the prompt must explain.
- (−) Tool names say which tools were used, not which result supports which sentence.
