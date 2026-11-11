# @mirelnan/prettier-config

The shared Prettier config, used by the root `package.json` (`"prettier": "@mirelnan/prettier-config"`).
Prettier runs once over the whole repository, not per package:

```bash
pnpm format         # write
pnpm format:check   # check (CI)
```

The pre-commit hook formats staged files before ESLint runs. Tool-managed files (`pnpm-lock.yaml`,
`pnpm-workspace.yaml`) and generated migrations are listed in `.prettierignore`.

## Options

Close to Prettier's defaults on purpose, so every option is a decision that can be explained:

| Option          | Value                   | Why                                                                  |
| --------------- | ----------------------- | -------------------------------------------------------------------- |
| `printWidth`    | `100`                   | fits two editor panes, fewer wrapped JSX and type signatures than 80 |
| `trailingComma` | `"all"`                 | adding an item changes one line in the diff                          |
| `singleQuote`   | `false`                 | the default, same quotes as JSON and JSX attributes                  |
| `endOfLine`     | `"lf"`                  | the same line endings on every machine                               |
| Markdown        | `proseWrap: "preserve"` | prose keeps its own line breaks                                      |

The others (`semi`, `tabWidth: 2`, `bracketSpacing`, `arrowParens: "always"`) are the defaults, written out
so the file is the full list.
