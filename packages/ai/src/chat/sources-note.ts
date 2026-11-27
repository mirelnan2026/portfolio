/**
 * How an earlier answer reaches the model on the next turn: with a note naming the tools it was written from, whose
 * results the model no longer sees (ADR 0012). The system prompt explains the note; an answer written without tools
 * gets none.
 */
export function withSourcesNote(content: string, tools: readonly string[]): string {
  return tools.length === 0 ? content : `${content}\n<sources>${tools.join(", ")}</sources>`;
}
