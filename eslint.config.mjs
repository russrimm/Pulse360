import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import css from "@eslint/css";
import { defineConfig } from "eslint/config";

export default defineConfig([
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

  // JS / TS source files
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"], plugins: { js }, extends: ["js/recommended"] },
  // Next.js runs both server-side (Node.js) and client-side (browser), so include both global sets.
  // This also covers CJS config files (next.config.js, postcss.config.js) that use module/require/__dirname.
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"], languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  tseslint.configs.recommended,

  // React plugin — scoped to JS/TS/JSX/TSX only.
  // Without a `files` restriction, pluginReact.configs.flat.recommended applies to ALL files
  // (including JSON/CSS/Markdown). The json/json SourceCode lacks getAllComments(), which
  // crashes react/display-name (eslint-plugin-react pragma.js:54). Scoping to JS/TS files fixes this.
  // react/react-in-jsx-scope is off: React 17+ new JSX transform doesn't require React in scope.
  // react/prop-types is off: TypeScript already enforces prop types.
  {
    ...pluginReact.configs.flat.recommended,
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    settings: { react: { version: "detect" } },
    rules: {
      ...pluginReact.configs.flat.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },

  // Non-JS languages — each scoped to its own file type
  { files: ["**/*.json"], plugins: { json }, language: "json/json", extends: ["json/recommended"] },
  { files: ["**/*.jsonc"], plugins: { json }, language: "json/jsonc", extends: ["json/recommended"] },
  { files: ["**/*.md"], plugins: { markdown }, language: "markdown/gfm", extends: ["markdown/recommended"] },
  { files: ["**/*.css"], plugins: { css }, language: "css/css", extends: ["css/recommended"] },
]);
