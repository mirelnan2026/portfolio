# @mirelnan/ai

The AI use cases of the portfolio: what the "Ask about me" chat accepts and sends to Claude, and, from stage 2,
the Claude tools shared by the chat and the MCP server. It reads data only through the repository ports of
`@mirelnan/domain` and never touches the database, a framework or a secret: the Anthropic client and its API
key are created by each app's composition root.

```
src/
└─ chat/   the chat's input: limits and the conversation schema
```

## Public API

| Export                   | What                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `chatLimits`             | caps on a conversation: message count (odd, so it ends with a question) and message length |
| `chatConversationSchema` | zod schema for the conversation a visitor sends (untrusted input, validated at the route)  |
| `ChatConversation`       | its type; each `ChatMessage` is assignable to the SDK's `MessageParam`                     |

## Rules

- **The conversation is untrusted.** It comes from the browser, assistant turns included, so every message is
  length-capped, roles must alternate (user, assistant, …, user) and `system` is not a role a visitor can send:
  only the server writes system instructions.
- **Limits bound the cost.** The API is stateless, so the whole conversation is resent on every request; the
  caps bound the input tokens of one request. A conversation over the cap is rejected, not trimmed.
- **No I/O here.** Data comes through `Pick<Repositories, …>` (never `products`: product descriptions are site
  context only); no `@mirelnan/db`, `drizzle-orm`, `pg`, `@mirelnan/cv-data`, React or Next (an ESLint rule in
  `eslint.config.js`).
