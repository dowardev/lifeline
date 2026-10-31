import pluginVue from "eslint-plugin-vue";
import eslintConfigPrettier from "eslint-config-prettier";
import pluginOxlint from "eslint-plugin-oxlint";
import js from "@eslint/js";
import ts from "typescript-eslint";

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "ios/**",
      "android/**",
      ".idea/**",
      ".vscode/**",
      ".env.local",
      ".env.*.local",
      "*.log",
      "*.suo",
      "*.ntvs*",
      "*.njsproj",
      "*.sln",
      "*.sw?",
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  eslintConfigPrettier,
  ...pluginOxlint.buildFromOxlintConfigFile(".oxlintrc.json"),
  {
    files: ["*.vue", "**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: "@typescript-eslint/parser",
      },
    },
  },
  {
    rules: {
      "vue/no-deprecated-slot-attribute": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-empty-object-type": "warn",
    },
  },
  {
    // Plain ESM scripts that run with `node` (the e2e harness). They are
    // JavaScript, not TypeScript: the Node globals are available and the
    // TypeScript-only rules do not apply.
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },
];