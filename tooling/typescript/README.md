# @mirelnan/tsconfig

Shared TypeScript configs. A package's `tsconfig.json` extends one preset and adds only its `include`.

| Preset         | For                                                 | Adds to `base.json`                                   |
| -------------- | --------------------------------------------------- | ----------------------------------------------------- |
| `base.json`    | the common settings, extended by every preset       | —                                                     |
| `library.json` | runtime-agnostic packages (`domain`, `cv-data`)     | `lib: ES2024`, no ambient types (no Node, no DOM)     |
| `node.json`    | code that runs on Node.js (`db`, `cv-data/scripts`) | `types: ["node"]`                                     |
| `nextjs.json`  | the Next.js app (`apps/web`)                        | DOM libs, `jsx: preserve`, `allowJs`, the Next plugin |

```json
{
  "extends": "@mirelnan/tsconfig/library.json",
  "include": ["src"]
}
```

## What `base.json` decides

- **Strictness:** `strict`, `noUncheckedIndexedAccess` (an array or record read may be `undefined`),
  `noImplicitOverride`, `noFallthroughCasesInSwitch`.
- **Modules:** `module: ESNext` with `moduleResolution: Bundler` (packages are consumed as TypeScript source,
  without a build step), `verbatimModuleSyntax` and `isolatedModules` (type-only imports are written as
  `import type`, so each file can be compiled on its own by Turbopack, tsx or Vitest).
- **No output:** `noEmit`. `tsc` only checks types; the tools that run the code compile it themselves.
- **Target:** ES2024, supported by Node 26 and by current browsers (the browsers set the floor).

TypeScript is 6.0.x (not 7), because Next.js, typescript-eslint and drizzle-kit need the JavaScript compiler API.
