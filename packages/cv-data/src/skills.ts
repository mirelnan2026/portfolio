import type { Skill, SkillCategory } from "@mirelnan/domain";

type Entry = [slug: string, name: string];

/** One group of skills that share a category and a source. */
function group(category: SkillCategory, sourceSlug: string, entries: Entry[]): Skill[] {
  return entries.map(([slug, name]) => ({ slug, name, category, sourceSlug }));
}

/**
 * Every technology the CV names, in the CV's categories and order: first the "Technical skills"
 * section, then the "Technologies" lines of the roles, then the JWX brief's "Technical range".
 */
export const skills: Skill[] = [
  ...group("frontend", "cv", [
    ["angular", "Angular"],
    ["react", "React"],
    ["typescript", "TypeScript"],
    ["javascript", "JavaScript (ES6+)"],
    ["rxjs", "RxJS"],
    ["ngrx", "NgRx"],
    ["ngxs", "NGXS"],
    ["redux", "Redux"],
    ["flux", "Flux"],
    ["graphql", "GraphQL"],
    ["apollo-client", "Apollo Client"],
    ["html5", "HTML5"],
    ["css3", "CSS3"],
    ["sass", "SASS"],
    ["flexbox", "Flexbox"],
    ["responsive-web-design", "Responsive Web Design"],
    ["single-page-applications", "Single Page Applications"],
    ["jquery", "jQuery"],
    ["ajax", "AJAX"],
    ["jsx", "JSX"],
    ["stripe-js", "Stripe.js"],
    ["html4", "HTML4"],
    ["xhtml", "XHTML"],
    ["css2", "CSS2"],
  ]),
  ...group("frontend", "jwx-brief", [
    ["preact", "Preact"],
    ["tanstack-query", "TanStack Query"],
    ["web-components", "Web Components"],
  ]),
  ...group("ui-libraries", "cv", [
    ["angular-material", "Angular Material"],
    ["material-ui", "Material UI"],
    ["bootstrap", "Bootstrap"],
    ["primeng", "PrimeNG"],
    ["syncfusion-ui", "Syncfusion UI"],
  ]),
  ...group("backend-and-data", "cv", [
    ["nodejs", "Node.js"],
    ["expressjs", "Express.js"],
    ["nestjs", "NestJS"],
    ["rest-apis", "REST APIs"],
    ["mysql", "MySQL"],
    ["postgresql", "PostgreSQL"],
    ["mongodb", "MongoDB"],
    ["redis", "Redis"],
    ["json", "JSON"],
    ["php", "PHP"],
    ["laravel", "Laravel"],
    ["socket-io", "Socket.io"],
    ["websockets", "WebSockets"],
    ["kraken-js", "Kraken.js"],
  ]),
  ...group("testing-and-tooling", "cv", [
    ["vite", "Vite"],
    ["vitest", "Vitest"],
    ["nightwatch-js", "Nightwatch.js"],
    ["selenium", "Selenium"],
    ["git", "Git"],
    ["gitlab-ci-cd", "GitLab CI/CD"],
    ["jira", "JIRA"],
    ["google-tag-manager", "Google Tag Manager"],
  ]),
  ...group("cloud", "cv", [["aws", "AWS (Cognito, Amplify)"]]),
  ...group("ai-assisted-development", "cv", [
    ["claude-code", "Claude Code"],
    ["spec-driven-delivery", "Spec-driven delivery workflows"],
  ]),
  ...group("practices", "cv", [
    ["agile", "Agile"],
    ["scrum", "Scrum"],
    ["code-review", "Code review"],
    ["object-oriented-programming", "Object-oriented programming"],
    ["web-accessibility", "Web accessibility"],
  ]),
];
