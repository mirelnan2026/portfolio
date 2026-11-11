import library from "@mirelnan/eslint-config/library";
import { defineConfig } from "eslint/config";

export default defineConfig(
  library,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // Generators run on the owner's machine (Node.js), never in a consumer, so they may use Node built-ins and
    // report to the terminal; the layer rule still holds.
    files: ["scripts/**/*.ts"],
    rules: {
      "no-console": "off",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@mirelnan/db", "@mirelnan/db/*", "@mirelnan/ai", "@mirelnan/ai/*"],
              message: "Library packages are inner layers: they must not depend on db or ai.",
            },
          ],
        },
      ],
    },
  },
);
