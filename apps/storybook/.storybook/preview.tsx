import { useEffect } from "react"
import type { Decorator, Preview } from "@storybook/react-vite"

// The three stylesheets a consumer adds, in the order the quick-start guide
// documents them: tokens, then the elements' stylesheet, then the layout
// primitives. Importing the same files keeps the workshop honest — a component
// that only looks right under Storybook's own CSS would be a lie.
import "@santaka-ui/tokens/css"
import "@santaka-ui/web-components/santaka.css"
import "@santaka-ui/styles/index.css"

// Registering the elements is what makes a preview real rather than a picture
// of one. This uses the loader — the explicit, documented entry point — and not
// a bare `import "@santaka-ui/web-components"`.
//
// The difference is not cosmetic. The eager entry is a side-effect-only import,
// and a bundler that honours the package's `sideEffects` field can drop it: the
// registration calls live in the per-component chunks, which the field does not
// name. The first build here proved it — the elements rendered as unstyled tags
// and `customElements.get("sk-button")` was `undefined`. `defineCustomElements`
// is a real call, so nothing can elide it.
import { defineCustomElements } from "@santaka-ui/web-components/loader"

void defineCustomElements(window)

const THEMES = ["light", "dark"] as const
type Theme = (typeof THEMES)[number]

/** Title-case a theme name for the toolbar label. */
const themeTitle = (theme: string) => theme.charAt(0).toUpperCase() + theme.slice(1)

/**
 * Theme is a document-level concern: `dark.css` selects on
 * `[data-sk-theme="dark"]` at `:root`, so a component cannot switch it locally.
 * The decorator sets the attribute on the preview document for as long as the
 * story is mounted and restores the previous value on unmount, so one story's
 * theme cannot leak into the next.
 */
const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme as Theme

  function ThemedStory() {
    useEffect(() => {
      const root = document.documentElement
      const previous = root.getAttribute("data-sk-theme")
      root.setAttribute("data-sk-theme", theme)

      return () => {
        if (previous === null) root.removeAttribute("data-sk-theme")
        else root.setAttribute("data-sk-theme", previous)
      }
    }, [])

    return <Story />
  }

  return <ThemedStory />
}

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: "Santaka UI theme (ADR-013: data-sk-theme on the root element)",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: THEMES.map((theme) => ({ value: theme, title: themeTitle(theme) })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // The dark theme is not a CSS media query here — it is the `data-sk-theme`
    // attribute the decorator sets — so the built-in backgrounds addon would be
    // a second, conflicting way to say the same thing. The theme toolbar is the
    // one control.
    backgrounds: { disable: true },
    a11y: {
      // The project's own gate is `pnpm run test:a11y` against real pages; this
      // addon is a workshop aid, so it reports without failing a build.
      test: "todo",
    },
  },
}

export default preview
