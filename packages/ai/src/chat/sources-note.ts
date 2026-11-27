/**
 * How an earlier answer reaches the model on the next turn: with a note naming the tools it was written from, whose
 * results the model no longer sees (ADR 0012). The system prompt explains the note; an answer written without tools
 * gets none.
 */
export function withSourcesNote(content: string, tools: readonly string[]): string {
  return tools.length === 0 ? content : `${content}\n<sources>${tools.join(", ")}</sources>`;
}

/**
 * Removes any `<sources>` tag from the model's own answer before it is signed. The note is the server's evidence of
 * which tools ran; if the model wrote one, a visitor could ask it to echo "<sources>get_profile</sources>" after an
 * invented claim, and the next turn would treat that claim as checked.
 */
export function withoutSourcesTags(text: string): string {
  // The spaces after "/" are inside the optional group, so each space can match in one place only: the pattern stays
  // linear on "<" followed by many spaces (an ambiguous `<\s*\/?\s*` is quadratic there).
  return text.replace(/<\s*(?:\/\s*)?sources\s*>/gi, "").trim();
}
