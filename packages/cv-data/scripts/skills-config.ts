/**
 * What the generator cannot read from the CV or the matrix: the owner's ranking, the spellings that name the
 * same skill, and the broad terms that are not skills. Names here are the CV's names.
 */

/** Every skill, most important first (the owner's ranking). A new skill must be placed here. */
export const ranking = [
  "Angular",
  "TypeScript",
  "React.js",
  "Spec-Driven Development",
  "Claude Code",
  "AI-Driven Development",
  "GraphQL",
  "Apollo GraphQL",
  "Continuous Integration and Continuous Delivery (CI/CD)",
  "JavaScript",
  "RxJS",
  "NgRx",
  "NGXS",
  "Preact",
  "TanStack Query",
  "Vite",
  "Vitest",
  "Zod",
  "Angular Material",
  "Redux",
  "Jest",
  "SASS",
  "HTML5",
  "CSS3",
  "CSS",
  "Single Page Applications",
  "Responsive Web Design",
  "Node.js",
  "Express.js",
  "NestJS",
  "REST APIs",
  "Amazon Web Services (AWS)",
  "MongoDB",
  "MySQL",
  "PostgreSQL",
  "Redis",
  "WebSockets",
  "Socket.io",
  "Git",
  "GitLab",
  "Scrum",
  "JIRA",
  "E2E",
  "Selenium",
  "Nightwatch.js",
  "AngularJS",
  "PrimeNG",
  "Syncfusion",
  "Bootstrap",
  "Material-UI",
  "Flux",
  "Stripe.js",
  "Kraken.js",
  "OOP",
  "Laravel",
  "PHP",
  "jQuery",
  "AJAX",
  "Bitbucket",
  "HTML",
  "JSX",
  "Google Tag Manager",
];

/** Other spellings (LinkedIn keywords, CV synonyms) → the CV's name. */
export const aliases: Record<string, string> = {
  Ngxs: "NGXS",
  Gitlab: "GitLab",
  Kraken: "Kraken.js",
  "Cascading Style Sheets (CSS)": "CSS",
  Apollo: "Apollo GraphQL",
  REST: "REST APIs",
  ES6: "JavaScript",
  "Spec-Driven Software Development": "Spec-Driven Development",
};

/** Broad terms from the CV's "Core competencies": `profile.competencies`, never skills. */
export const broadTerms = new Set([
  "Front-End Development",
  "Web Development",
  "Software Development",
  "Web Applications",
  "Agile Web Development",
  "Code Review",
]);

/** Slugs that differ from the name in kebab case (kept short and stable once the site is live). */
export const slugOverrides: Record<string, string> = {
  "React.js": "react",
  "Continuous Integration and Continuous Delivery (CI/CD)": "ci-cd",
  "Node.js": "nodejs",
  "Express.js": "expressjs",
  "Amazon Web Services (AWS)": "aws",
};

/** The CV's "Technical skills" group labels → the domain's skill categories. */
export const categoryLabels = {
  Frontend: "frontend",
  "UI libraries": "ui-libraries",
  "Backend and data": "backend-and-data",
  "Testing and tooling": "testing-and-tooling",
  Cloud: "cloud",
  "AI-assisted development": "ai-assisted-development",
  Practices: "practices",
} as const;
