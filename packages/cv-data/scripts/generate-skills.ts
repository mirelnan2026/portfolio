/**
 * Regenerates `src/skills.ts` and the `skills` block of every `src/experiences/<slug>.ts` from two private
 * documents: the CV (names, groups, each role's "Technologies" line) and the skills matrix (every link, with
 * the JWX phase). Links the employment brief already states keep their source and context note.
 * See scripts/README.md.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import type { SkillCategory } from "@mirelnan/domain";
import { cvData } from "../src/cv";
import { aliases, broadTerms, categoryLabels, ranking, slugOverrides } from "./skills-config";

const packageDir = resolve(import.meta.dirname, "..");
const { values: args } = parseArgs({
  options: {
    matrix: { type: "string", default: join(import.meta.dirname, "input/skills-matrix.csv") },
    cv: { type: "string", default: join(import.meta.dirname, "input/cv.pdf") },
  },
});

function fail(message: string): never {
  throw new Error(message);
}

/** The CV's name for a spelling from the CV or the matrix. */
function canonical(name: string): string {
  const resolved = aliases[name] ?? name;
  if (!ranking.includes(resolved)) {
    fail(`Unknown skill "${name}": add it to the ranking or to the aliases in skills-config.ts`);
  }
  return resolved;
}

function slugOf(name: string): string {
  return (
    slugOverrides[name] ??
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

/** A minimal CSV reader: comma-separated, fields optionally in double quotes ("" is a quote). */
function readCsv(text: string): Record<string, string>[] {
  const rows = text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const fields: string[] = [];
      let field = "";
      let quoted = false;
      for (let index = 0; index < line.length; index++) {
        const char = line.charAt(index);
        if (quoted && char === '"' && line[index + 1] === '"') {
          field += '"';
          index++;
        } else if (char === '"') {
          quoted = !quoted;
        } else if (char === "," && !quoted) {
          fields.push(field);
          field = "";
        } else {
          field += char;
        }
      }
      fields.push(field);
      return fields;
    });
  const [header = [], ...body] = rows;
  return body.map((fields) =>
    Object.fromEntries(header.map((key, index) => [key, fields[index] ?? ""])),
  );
}

// The CV, as text. `pdftotext` (poppler-utils) keeps the layout, so each role's lines stay together.
const cv = execFileSync("pdftotext", ["-layout", args.cv, "-"], { encoding: "utf8" });

// Categories: the groups of the CV's "Technical skills" section.
const section = (cv.split("TECHNICAL SKILLS")[1] ?? fail("No TECHNICAL SKILLS section in the CV"))
  .split(/E\s*D\s*U\s*C/)[0]
  ?.replace(/\s+/g, " ");
const labels = Object.keys(categoryLabels).join("|");
const categories = new Map<string, SkillCategory>();
for (const [, label, list] of section?.matchAll(
  new RegExp(`(${labels}): (.*?)(?= (?:${labels}):|$)`, "g"),
) ?? []) {
  for (const name of (list ?? "").split(", ")) {
    const skill = canonical(name.trim());
    if (!categories.has(skill)) {
      categories.set(skill, categoryLabels[label as keyof typeof categoryLabels]);
    }
  }
}
const uncategorised = ranking.filter((name) => !categories.has(name));
if (uncategorised.length > 0) {
  fail(`In the ranking but not in the CV's "Technical skills": ${uncategorised.join(", ")}`);
}

// Each role's "Technologies" line, in the CV's order of roles; a line ending in a comma wraps.
const technologies: string[][] = [];
let line: string | null = null;
for (const raw of cv.split("\n").map((text) => text.trim())) {
  if (line === null && raw.startsWith("Technologies:")) {
    line = raw.slice("Technologies:".length).trim();
  } else if (line !== null) {
    line += ` ${raw}`;
  }
  if (line !== null && !line.endsWith(",")) {
    technologies.push(line.split(", ").map((name) => canonical(name.trim())));
    line = null;
  }
}
if (technologies.length !== cvData.experiences.length) {
  fail(
    `The CV has ${String(technologies.length)} "Technologies" lines for ${String(cvData.experiences.length)} roles`,
  );
}

// The matrix: experienceSlug → skill → phase (null = the whole experience).
const matrix = new Map<string, Map<string, string | null>>();
for (const row of readCsv(readFileSync(args.matrix, "utf8"))) {
  const { experienceSlug = "", phaseSlug = "", skill = "" } = row;
  if (broadTerms.has(skill)) {
    continue;
  }
  const name = canonical(skill);
  const links = matrix.get(experienceSlug) ?? new Map<string, string | null>();
  const phase = phaseSlug === "" ? null : phaseSlug;
  if (links.has(name) && links.get(name) !== phase) {
    fail(`${experienceSlug}: "${name}" has two different phases`);
  }
  links.set(name, phase);
  matrix.set(experienceSlug, links);
}

const json = (value: unknown) => JSON.stringify(value);

/** Consecutive plain links (same source and phase, no note) become one `usedSkills(...)` call. */
interface Run {
  source: string;
  phase: string | null;
  slugs: string[];
}

function skillsBlock(experienceSlug: string, line: string[]): string {
  const links = matrix.get(experienceSlug) ?? fail(`No rows for "${experienceSlug}" in the matrix`);
  const missing = line.filter((name) => !links.has(name));
  if (missing.length > 0) {
    fail(
      `${experienceSlug}: the CV's "Technologies" line names ${missing.join(", ")}, the matrix does not`,
    );
  }
  const experience = cvData.experiences.find((item) => item.slug === experienceSlug);
  // The card order: the role's "Technologies" line, then the rest by rank.
  const names = [
    ...line,
    ...[...links.keys()]
      .filter((name) => !line.includes(name))
      .sort((a, b) => ranking.indexOf(a) - ranking.indexOf(b)),
  ];
  const parts: (string | Run)[] = [];
  let run: Run | null = null;
  for (const name of names) {
    const slug = slugOf(name);
    const phase = links.get(name) ?? null;
    const brief = experience?.skills.find(
      (usage) =>
        usage.skillSlug === slug &&
        usage.sourceSlug !== "cv" &&
        usage.sourceSlug !== "skills-matrix",
    );
    if (brief !== undefined) {
      run = null;
      parts.push(
        `{ skillSlug: ${json(slug)}, phaseSlug: ${json(phase)}, contextNote: ${json(brief.contextNote)}, sourceSlug: ${json(brief.sourceSlug)} },`,
      );
      continue;
    }
    const source = line.includes(name) ? "cv" : "skills-matrix";
    if (run !== null && run.source === source && run.phase === phase) {
      run.slugs.push(slug);
      continue;
    }
    run = { source, phase, slugs: [slug] };
    parts.push(run);
  }
  const text = parts.map((part) => {
    if (typeof part === "string") {
      return part;
    }
    const { source, phase, slugs } = part;
    return `...usedSkills(${json(source)}, ${json(slugs)}${phase === null ? "" : `, ${json(phase)}`}),`;
  });
  return `  skills: [\n${text.join("\n")}\n  ],\n`;
}

// Every file is computed before any is written, so a failed check leaves the sources untouched.
const outputs = new Map<string, string>();
cvData.experiences.forEach((experience, index) => {
  const file = join(packageDir, "src/experiences", `${experience.slug}.ts`);
  const source = readFileSync(file, "utf8");
  // Prettier writes a short block on one line and a long one across lines, closed by "  ],".
  const pattern = /^ {2}skills: (?:\[[^\n]*\],|\[\n[\s\S]*?\n {2}\],)\n/m;
  if (!pattern.test(source)) {
    fail(`No "skills: [ … ]," block in ${file}`);
  }
  outputs.set(
    file,
    source.replace(pattern, () => skillsBlock(experience.slug, technologies[index] ?? [])),
  );
});

outputs.set(
  join(packageDir, "src/skills.ts"),
  [
    'import type { Skill, SkillCategory } from "@mirelnan/domain";',
    "",
    "function skill(slug: string, name: string, category: SkillCategory): Skill {",
    '  return { slug, name, category, sourceSlug: "cv" };',
    "}",
    "",
    "/**",
    " * Every skill in the CV's \"Technical skills\", with the CV's names and categories, most important first:",
    " * the position is the owner's ranking, which the site and the AI tools keep. Each one is linked to at",
    " * least one experience (see `experiences/`). Generated by `scripts/generate-skills.ts`.",
    " */",
    "export const skills: Skill[] = [",
    ...ranking.map(
      (name) => `  skill(${json(slugOf(name))}, ${json(name)}, ${json(categories.get(name))}),`,
    ),
    "];",
    "",
  ].join("\n"),
);

for (const [file, text] of outputs) {
  writeFileSync(file, text);
}

// Same formatting as the rest of the repo.
execFileSync("pnpm", ["exec", "prettier", "--write", ...outputs.keys()], {
  cwd: resolve(packageDir, "../.."),
  stdio: ["ignore", "ignore", "inherit"],
});
const linkCount = [...matrix.values()].reduce((sum, links) => sum + links.size, 0);
console.log(
  `Wrote ${String(ranking.length)} skills and ${String(linkCount)} links for ${String(cvData.experiences.length)} experiences.`,
);
