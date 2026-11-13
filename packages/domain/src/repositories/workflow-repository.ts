import type { WorkflowStep } from "../entities/workflow-step";

export interface WorkflowRepository {
  /** The steps of the workflow, in order. */
  list(): Promise<WorkflowStep[]>;
}
