import js from "@eslint/js"
import tseslint from "typescript-eslint"
import globals from "globals"
import prettier from "eslint-config-prettier"

/**
 * Root flat ESLint config (ADR-018).
 *
 * Scope is deliberately narrow: JavaScript/TypeScript correctness and
 * formatting-adjacent rules only. Stylistic rules belong to Prettier
 * (`prettier --check .`), and type-level rules belong to `tsc --noEmit`.
 * Adding a second linter is an ADR (section 18 of plan.md).
 */
export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/www/**",
      "**/loader/**",
      "**/.stencil/**",
      "**/coverage/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "**/.turbo/**",
      "**/generated/**",
      "**/*.d.ts",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "no-console": ["error", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "always", { null: "ignore" }],
      "prefer-const": "error",
    },
  },
  {
    // Tests may use console freely and are allowed to be loose about
    // assertions on DOM fixtures.
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}", "**/e2e/**", "**/tests/**"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    // Stencil's JSX transform compiles away `<Host>` at build time, so the `h`
    // import looks unused to a linter that does not run the compiler. It is
    // required: `jsxFactory` is configured to point at it.
    files: ["packages/web-components/src/**/*.tsx"],
    rules: {
      // The JSX factory itself is the exception, and only for this pattern.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_|^h$",
          ignoreRestSiblings: true,
          reportUsedIgnorePattern: false,
        },
      ],
    },
  },
  {
    // Build and codegen scripts run in Node. `serve-examples.mjs` and
    // `debug-page.mjs` also drive a browser through Playwright, so browser
    // globals are available there too — but only there, so a Node script can
    // still never reference `window` by accident.
    files: ["**/scripts/**", "**/*.config.{ts,js,mts,mjs}"],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
  {
    // CLI end-to-end tests and the consumer fixture run real processes, so they
    // use `process`, `console`, and `node:*` directly. They are `.mjs`, which the
    // TypeScript block above does not cover, so they would otherwise be linted as
    // browser scripts and fail on `process` being undefined.
    files: ["**/e2e/**/*.mjs", "tests/**/*.mjs"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  prettier,
)
