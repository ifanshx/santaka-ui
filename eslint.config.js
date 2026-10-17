import js from "@eslint/js"
import tseslint from "typescript-eslint"
import globals from "globals"
import prettier from "eslint-config-prettier"
import vue from "eslint-plugin-vue"
import vueParser from "vue-eslint-parser"

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
      "**/storybook-static/**",
      // Next.js build output: generated, never linted (the same reason .turbo is
      // here, and the same rule .prettierignore already states for this directory).
      "**/.next/**",
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
    // An example's own server process. `examples/svelte-vite/server.mjs` serves
    // the built client assets and renders the page per request, so it is Node
    // code — but it lives next to the example's browser code, not under
    // `**/scripts/**`, so without this it would be linted as a browser script and
    // fail on `process` being undefined.
    files: ["examples/**/server.mjs"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    // CLI end-to-end tests and the consumer fixture run real processes, so they
    // use `process`, `console`, and `node:*` directly. They are `.mjs`, which the
    // TypeScript block above does not cover, so they would otherwise be linted as
    // browser scripts and fail on `process` being undefined.
    //
    // Browser globals are also allowed here because the consumer fixture drives a
    // real page: `page.evaluate(() => getComputedStyle(…))` is a callback that
    // runs in the browser, so `document`, `customElements`, and
    // `getComputedStyle` are correct there even though the file itself is Node.
    files: ["**/e2e/**/*.mjs", "tests/**/*.mjs"],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
  {
    // The vanilla example's own scripts. Nothing covered them: `examples/react-vite`,
    // `vue-vite`, and `svelte-vite` each run `eslint .` from their own package, and
    // `examples/vanilla-html` has no `package.json` — it is mounted by the
    // Playwright config rather than built. So its `main.js` was linted by nobody,
    // and when run by hand it reported eighteen `no-undef` errors for `document`,
    // `fetch`, and `CustomEvent`: browser globals in a file the config had no
    // browser block for. A file that would fail the rules and is simply not
    // covered is worse than one that fails, because nothing reports it.
    files: ["examples/vanilla-html/**/*.js"],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  {
    // Vue single-file components. `eslint-plugin-vue` is a plugin for the
    // existing ESLint, not a second linter — ADR-018's "no additional linter"
    // rule is about a second tool, and this is the same one. It is needed
    // because the flat config above matches only `**/*.{ts,tsx,mts,cts}`, so a
    // `.vue` file was silently unlinted: `eslint .` exited 0 while skipping it,
    // which is worse than not running a linter at all. Recorded in ADR-018.
    //
    // The parser is `vue-eslint-parser` with `typescript-eslint` as the inner
    // parser for `<script lang="ts">`, so the same rules that apply to the
    // adapter packages apply inside the example's SFC.
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 2023,
        sourceType: "module",
        extraFileExtensions: [".vue"],
      },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { vue, "@typescript-eslint": tseslint.plugin },
    extends: [...vue.configs["flat/recommended"]],
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "no-console": ["error", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "always", { null: "ignore" }],
      "prefer-const": "error",
    },
  },
  prettier,
)
