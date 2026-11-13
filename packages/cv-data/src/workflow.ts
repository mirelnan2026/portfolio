import type { WorkflowStep } from "@mirelnan/domain";

/** How the owner works with AI agents, in order, from the employment brief's answer on AI tools. */
export const workflow = [
  {
    slug: "specify",
    title: "Specify",
    body:
      "I write the specification. It is reviewed before any code exists, so mistakes are caught " +
      "there, not in the code.",
    sourceSlug: "jwx-brief",
  },
  {
    slug: "implement",
    title: "Implement",
    body: "I drive the implementation through the agent, which produces the code from the specification.",
    sourceSlug: "jwx-brief",
  },
  {
    slug: "own-the-result",
    title: "Own the result",
    body: "Review, verification and release stay with me: nothing reaches production without my review.",
    sourceSlug: "jwx-brief",
  },
] satisfies WorkflowStep[];
