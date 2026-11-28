/**
 * The lines the chat shows a visitor that both sides need: the route sends them, the browser recognises them.
 * No server-only code here, so the client component can import it.
 */
export const chatErrors = {
  conversationEnded: "This conversation can no longer continue. Start a new one.",
  unavailable: "The chat is unavailable right now. Try again later.",
  conversationFull: "This conversation has reached its limit. Start a new one to ask more.",
} as const;
