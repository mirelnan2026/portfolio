import next from "@mirelnan/eslint-config/next";
import { defineConfig } from "eslint/config";

export default defineConfig(next, {
  languageOptions: {
    parserOptions: {
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
