import type { WorkflowRepository } from "@mirelnan/domain";
import { asc, eq } from "drizzle-orm";
import type { Database } from "../database";
import { sources, workflowSteps } from "../schema";

export function createDrizzleWorkflowRepository(db: Database): WorkflowRepository {
  return {
    list: () =>
      db
        .select({
          slug: workflowSteps.slug,
          title: workflowSteps.title,
          body: workflowSteps.body,
          sourceSlug: sources.slug,
        })
        .from(workflowSteps)
        .innerJoin(sources, eq(workflowSteps.sourceId, sources.id))
        .orderBy(asc(workflowSteps.position)),
  };
}
