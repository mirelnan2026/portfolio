import base from "@mirelnan/eslint-config/base";
import { defineConfig } from "eslint/config";

export default defineConfig(
  base,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // Command-line scripts report to the terminal.
    files: ["src/cli/**/*.ts"],
    rules: { "no-console": "off" },
  },
);
