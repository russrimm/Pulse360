import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { defineConfig } from "eslint/config";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  // Global ignores — build artifacts, generated files, and non-source directories.
  // Must be a standalone object (no `files` key) to act as global ignores in ESLint 9.
  {
    ignores: [
      ".next/**",
      "out/**",
      "dist/**",
      "build/**",
      ".github/**",
      ".squad/**",
      "security-review/**",
      "tests-examples/**",
      "src/generated/**",
      "next-env.d.ts",
      "package-lock.json",
    ],
  },

  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "prefer-const": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);
