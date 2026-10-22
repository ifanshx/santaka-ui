import type { StorybookConfig } from "@storybook/react-vite"

/**
 * Storybook configuration (docs/ARCHITECTURE.md section 10).
 *
 * The framework is `@storybook/react-vite`, and that is a decision, not a
 * default: it is recorded in ADR-020. The React adapter is the reference
 * implementation every other framework wrapper follows, and it is the one whose
 * custom elements are already proven against the registry. Vue, Svelte and
 * Angular adapters do not exist yet, so a "universal" renderer here would be
 * pretending to host adapters that are not written.
 *
 * The stories import `@santaka-ui/react` — the package a consumer installs —
 * never `packages/react/src`. A workshop that reaches into source can show a
 * component that a published consumer cannot build.
 */
const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  typescript: {
    // The adapter props are hand-written types, so `react-docgen-typescript`
    // reads the same types the consumer sees. The faster `react-docgen` only
    // understands a subset of TS and would quietly drop prop documentation.
    reactDocgen: "react-docgen-typescript",
  },
  // No `docs.autodocs` here. Storybook 8 and 9 accepted
  // `docs: { autodocs: "tag" }`, but Storybook 10 removed the option: the
  // `autodocs` tag is now the only mechanism, and every story opts in with
  // `tags: ["autodocs"]`. Keeping the block was a type error against
  // `DocsOptions`, which now carries only `defaultName` and `docsMode`.
}

export default config
