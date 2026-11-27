# @mirelnan/ai

The AI use cases of the portfolio: what the "Ask about me" chat accepts and sends to Claude, the system prompt that
sets its rules, and the Claude tools shared by the chat and the MCP server. It reads data only through the repository
ports of `@mirelnan/domain` and never touches the database, a framework or a secret: the Anthropic client and its API
key are created by each app's composition root.

```
src/
├─ chat/     the chat's input: limits and the conversation schema
├─ prompts/  the system prompt: the rules the model follows on every request
└─ tools/    the read-only CV tools shared by the chat and the MCP server, and their definitions for the API
```

## Public API

| Export                               | What                                                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chatLimits`                         | caps on a conversation: message count (odd, so it ends with a question) and message length                                                              |
| `chatConversationSchema`             | zod schema for the conversation a visitor sends (untrusted input, validated at the route)                                                               |
| `withSourcesNote`                    | an earlier answer as the model sees it: the text, then `<sources>…</sources>` with the tools it came from (ADR 0012)                                    |
| `withoutSourcesTags`                 | removes any `<sources>` note (with the tool names inside) or lone tag from the model's answer before it is signed, so only the server writes the note   |
| `ChatConversation`                   | its type; each `ChatMessage` is assignable to the SDK's `MessageParam`                                                                                  |
| `buildSystemPrompt()`                | the system prompt: role, tool use, grounding, reply format, language, confidentiality and injection rules; the same text on every call                  |
| `runCvTool(name, input, repos, now)` | runs one tool: validates the raw input, then reads; answers `{ ok, data }` or `{ ok: false, error }`, never throws                                      |
| `cvToolNames`                        | the eight tools: `get_profile`, `list_experiences`, `get_experience`, `search_cv`, `list_skills`, `list_case_studies`, `get_case_study`, `get_workflow` |
| `cvToolDefinitions`                  | the same tools as the Claude API expects them: name, description the model reads, and a JSON Schema generated from the zod input schema                 |
| `ToolDefinition`                     | the type of one entry of `cvToolDefinitions`                                                                                                            |
| `CvRepositories`                     | the ports the tools may read: profile, experiences, projects, skills, case studies, workflow (no `products`)                                            |
| `ToolResult`                         | the answer of `runCvTool`: `ok` with the data, or `unknown_tool`, `invalid_input` or `not_found`                                                        |

## Rules

- **The conversation is untrusted.** It comes from the browser, assistant turns included, so every message is
  length-capped, roles must alternate (user, assistant, …, user) and `system` is not a role a visitor can send:
  only the server writes system instructions.
- **Limits bound the cost.** The API is stateless, so the whole conversation is resent on every request; the
  caps bound the input tokens of one request. A conversation over the cap is rejected, not trimmed.
- **No I/O here.** Data comes through `Pick<Repositories, …>` (never `products`: product descriptions are site
  context only); no `@mirelnan/db`, `drizzle-orm`, `pg`, `@mirelnan/cv-data`, React or Next (an ESLint rule in
  `eslint.config.js`).
- **Tools are read-only and validate first.** Each tool's input is a strict zod object, checked before any
  repository is read. A tool name that is not in the registry is `unknown_tool`, including names such as
  `constructor` that exist on every object.
- **Tools return what the answer needs, nothing more.** Products are left out (site context only), and so are the
  competencies (kept for search engines, never shown). Experiences come without their highlights in the list and
  with them in `get_experience`. Search returns at most ten hits, and each hit keeps its `ownership` and its
  `sourceSlug`, so a contributed highlight is never presented as owned and every claim can be cited.
- **Search covers the whole CV a visitor can ask about.** `search_cv` looks at the roles' highlights and the skills of
  the roles and personal projects, by skill name and category ("cloud" finds AWS and Vercel); a project's highlights
  are owned. Hyphens and spaces are the same ("spec driven" finds "spec-driven"), each word matches at the start of a
  word ("AI" does not find "campaign"), generic words are dropped ("AI tools" searches "AI"), and from three words on
  one may be missing ("spec driven development"); hits that match more words come first. The trade-off of prefix
  matching: "React" also finds "reactive", and a category match ("testing") lists every skill in that category.
- **A role says whether it has ended.** `list_experiences` and `get_experience` give each role `status`: `"ended"`
  when its period has an end month, `"ongoing"` otherwise. With dates alone the model described an ended role in the
  present tense ("has been there since 2023"); the word, plus a prompt rule, keeps it in the past.
- **The current month is an argument.** `list_skills` needs it for ongoing periods; the package never reads the clock.
- **Tenure comes as a phrase, never as a number.** `list_skills` gives each skill `tenure`: "less than a year", "N
  years" for whole years, "more than N years" otherwise (the same rule as the page's `tenureLabel`). The prompt tells
  the model to use it word for word: with no bare number there is nothing to round up or state as exact.
- **The system prompt is the instruction channel.** It is the same text on every request and is never built from the
  visitor's text. Each rule in it has a test, so removing one fails the build. It stays under 4 600 characters, because
  it is paid for on every request (raised from 4 000 with the `<sources>` rule, then to 4 600 with the not-a-question
  rule after a measured compaction). A compaction is measured like any rule change: removing the role's "using only
  the tools you are given", which looked redundant, made 4 refusals in 15 open with "Not in the CV".
- **The definitions are generated, not written twice.** `cvToolDefinitions` reuses the schemas that validate the
  input, so the model is asked for exactly what `runCvTool` accepts.
