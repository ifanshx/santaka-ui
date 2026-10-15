---
"@santaka-ui/docs": minor
---

22 component pages plus an index, a quick start, and an SSR guide. Every component
page is derived from the same RegistryItem the CLI installs from, the MCP server
answers from, and llms.txt is written from — so a prop rename reaches all four
consumers or none. Props, events, known limitations, CSS variables, and the
stability label are read from the entry rather than written.

Search is Pagefind: a build-time index served as static files, searched in the
browser, with no hosted dependency. Preview islands import
@santaka-ui/web-components — the package a consumer installs — rather than a
monorepo path, so a preview cannot only work here. The previewable set is curated
and labelled as such, because the registry has no "required" flag to derive it
from.

Two findings while building. postcss-import resolves @import as a path, not a
package, so bundling the packages' CSS needed a Vite alias; the alternative, a
copy under public/, would be a second copy that could drift (ADR-012). And
Pagefind writes to dist/pagefind/, not dist/_pagefind/ — the search island's first
path was wrong and the index silently never loaded.

Nine tests assert against dist/ rather than source, because an Astro template that
renders nothing still compiles. The most valuable asserts that no page shows a prop
the component does not declare, which is the hand-written page ADR-006 rules out.

That assertion's first version did not work: it matched "name |" against
tag-stripped text, never matched a real row, and passed while an invented prop sat
in the table — a test reporting safety it had not checked. It now parses the built
td/code cells and is negative-tested by injecting a prop named "appearance".

Related: "every declared prop appears on the page" cannot fail by construction,
because a generated page loses a prop when the registry does. The direction that
catches drift is "the published payload equals the registry", asserted in
tests/registry/docs-source.test.mjs, which did catch it.
