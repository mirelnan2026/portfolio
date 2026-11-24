import base from "@mirelnan/eslint-config/base";
import { defineConfig } from "eslint/config";

export default defineConfig(base, {
  languageOptions: {
    parserOptions: {
      tsconfigRootDir: import.meta.dirname,
    },
  },
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@mirelnan/db", "@mirelnan/db/*", "@mirelnan/cv-data", "@mirelnan/cv-data/*"],
            message:
              "The AI layer reads data through the repository ports of @mirelnan/domain only.",
          },
          {
            group: ["drizzle-orm", "drizzle-orm/*", "pg", "@neondatabase/*", "@upstash/*"],
            message:
              "The AI layer does no I/O: database and rate-limit clients belong in the apps.",
          },
          {
            group: ["react", "react-dom", "next", "next/*"],
            message: "The AI layer is framework-free: UI code belongs in apps/web.",
          },
        ],
      },
    ],
  },
});
