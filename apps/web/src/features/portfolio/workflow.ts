import { sentences } from "./format";

/**
 * The sentence of the CV's summary that introduces the workflow ("In 2026 joined the first team in the company to
 * adopt spec-driven development with Claude AI."), word for word; null when the summary no longer has one.
 */
export function workflowIntro(summary: string): string | null {
  return sentences(summary).find((sentence) => /spec-driven/i.test(sentence)) ?? null;
}
