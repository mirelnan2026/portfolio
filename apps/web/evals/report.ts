import type { ToolCall } from "./graders";

export interface ReportFields {
  model: string;
  id: string;
  run: number;
  passed: boolean;
  seconds: number;
  costUsd: number;
  /** How many questions have been asked so far, out of how many the run plans. */
  progress: { done: number; planned: number };
  /** How many requests the model received for this question, the tool rounds included. */
  steps: number;
  calls: ToolCall[];
  failures: string[];
}

/**
 * One line per question: the verdict, the model, the case, the run number, the time, the cost, the tools the model
 * called and, for a failure, the reasons. One line each, so a run can be read and grepped.
 */
export function reportLine(fields: ReportFields): string {
  const verdict = fields.passed ? "PASS" : "FAIL";
  const tools =
    fields.calls.length === 0 ? "no tools" : fields.calls.map((call) => call.name).join(", ");
  const reasons = fields.failures.length === 0 ? "" : `  ${fields.failures.join("; ")}`;
  const time = fields.seconds.toFixed(1).padStart(5);
  const progress = `(${String(fields.progress.done)}/${String(fields.progress.planned)})`.padEnd(
    10,
  );
  const steps = `${String(fields.steps)} steps`.padEnd(8);
  return `${verdict} ${progress} ${fields.model.padEnd(18)} ${fields.id.padEnd(26)} #${String(fields.run)} ${time}s $${fields.costUsd.toFixed(4)}  ${steps} ${tools}${reasons}\n`;
}
