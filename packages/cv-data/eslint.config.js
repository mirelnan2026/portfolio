import library from "@mirelnan/eslint-config/library";
import { defineConfig } from "eslint/config";

export default defineConfig(library, {
  languageOptions: {
    parserOptions: {
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
