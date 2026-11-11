# @mirelnan/eslint-config

Shared ESLint flat configs (ESLint 10). Lint is for correctness only: formatting belongs to Prettier, and
`eslint-config-prettier` turns off every rule that would conflict with it.

| Preset    | For                                             | What it adds                                                                                                      |
| --------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `base`    | every TypeScript package (`db` uses it as is)   | `@eslint/js` recommended, typescript-eslint `strictTypeChecked` + `stylisticTypeChecked`, a few rules below       |
| `library` | runtime-agnostic packages (`domain`, `cv-data`) | `base` + import rules that keep them pure: no `db`/`ai`, no infrastructure clients, no `node:*`, no React or Next |
| `next`    | the Next.js app (`apps/web`)                    | Next's Core Web Vitals rules + `base` + jsx-a11y **strict** + no `drizzle-orm`, `pg` or `@mirelnan/cv-data`       |

```js
// eslint.config.js
import library from "@mirelnan/eslint-config/library";
import { defineConfig } from "eslint/config";

export default defineConfig(library, {
  languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } },
});
```

`tsconfigRootDir` is needed because type-aware rules find each file's `tsconfig.json` through
`projectService`, and the pre-commit hook runs ESLint over several packages at once.

## Rules worth knowing

- `eqeqeq`, `@typescript-eslint/consistent-type-imports` (type imports are `import type`),
  `switch-exhaustiveness-check` (a new enum value must be handled), unused variables allowed only with a `_`
  prefix, `no-console` (a warning; allowed in command-line scripts by a local override).
- **Layer boundaries** are `no-restricted-imports` patterns: an import that breaks the dependency direction
  fails lint, so the architecture is enforced, not only documented.
- Plain JavaScript files skip type-aware rules (`disableTypeChecked`).

## Versions

`eslint-config-next` has the same version as Next.js. Its React and import plugins, and jsx-a11y, declare
peer ranges that stop at ESLint 9; `peerDependencyRules.allowedVersions` in `pnpm-workspace.yaml` allows 10 for
exactly those plugins (they work with it: Next wraps two of them itself).
