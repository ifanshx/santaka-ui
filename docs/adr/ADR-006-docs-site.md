# ADR-006: Documentation site framework and search

- **Status:** Accepted
- **Date:** 2026-10-15
- **Specification:** §4 of [ARCHITECTURE.md](../ARCHITECTURE.md)

## Context

`docs/ARCHITECTURE.md` §10 names what the documentation site must carry — quick start per
framework and install mode, a searchable component catalogue and API reference,
copy-ready examples, live previews with a light/dark toggle and viewport
controls, theme and token documentation, accessibility notes, keyboard tables,
the browser support matrix, known limitations, and guides for SSR, hydration,
Tailwind v4, forms, customization, and migrations — plus "separate labels for
Stable, Preview, Experimental, and Deprecated".

§5's toolchain table already names the two tools: **Astro with content
collections** for the site and **Pagefind** for search. What §17 asks this record
to settle is *why*, and what it commits the project to.

## Evidence

**§5 already decided it.** The toolchain table lists "Docs site | Astro with
content collections" and "Docs search | Pagefind | Static index, no hosted search
dependency". An ADR is not a chance to relitigate a settled default; it is the
place to record the reason so nobody relitigates it later.

**The content is static, and the site should be too.** Component pages are
generated from the same registry metadata that feeds `llms.txt`, the MCP server,
and the CLI (ADR-015, ADR-007). Every input is a file in this repository. Shipping
that as static HTML is the same argument ADR-007 made about the registry: there is
no mutation between releases, so a runtime is a cost with no corresponding need.

**§11 forbids a hosted service for the AI surface, and the docs are adjacent.**
"Nothing in this section requires a hosted service." A search index that lives in
a third-party SaaS would put a dependency — and a data-processing relationship —
where the project has already said it wants none. Pagefind is a build-time index
served as static files: search runs in the browser against files shipped with the
site, with no API key and no telemetry.

**Live previews need real components, not screenshots.** §10 asks for light/dark
toggle, viewport controls, and code tabs. Astro's island model renders static HTML
by default and hydrates only the interactive islands, which is what lets a page be
mostly static while still running the actual custom elements. This is also
consistent with ADR-005: the components are server-renderable and hydrate through
the lazy loader, so the docs can render the real thing rather than a picture of
it.

**The docs directory already exists and is already being filled by the build.**
`apps/docs/public/` carries `llms.txt`, `llms-full.txt`, and the `registry/`
payload. The site's static asset root is not a proposal — it is written to on
every build. Any framework choice has to serve that directory as-is.

## Decision

**Astro, with content collections for the pages and Pagefind for search. The site
is static; only preview islands hydrate.**

### Content comes from the registry, not from hand-written pages

Every component page is generated from the same `RegistryItem` that feeds the CLI,
the MCP server, and `llms.txt`. One entry, four consumers; a prop renamed in a
component shows up everywhere or nowhere. A hand-written component page would be a
fifth, unaudited copy of `props`, `events`, and `knownLimitations`, which is
exactly the drift the registry exists to prevent.

`llms.txt`, `llms-full.txt`, and `registry/` are already generated into
`apps/docs/public/` by the build; `llms:check` fails if they differ from what the
generator writes.

### Search is Pagefind, built at build time

A static index served alongside the site. No account, no API key, no hosted
dependency, and nothing leaves the browser. This is the same reasoning §11 gives
for the MCP server's local index.

### Previews render the shipped package

A preview island imports from `@santaka-ui/web-components` — or the loader, for
the SSR path — rather than from a path inside the monorepo. A preview that works
only in this workspace would be a demo of something consumers cannot install,
which is the defect class the consumer fixture (§16) was built to catch.

### Stability labels are data, not prose

Stable / Preview / Experimental / Deprecated come from
`RegistryItem.stability`, the same field the CLI's `list` orders by and
`search_components` ranks by. §10's requirement is satisfied by reading the field,
not by reminding authors to write the right word in a heading.

## Consequences

- **Astro and Pagefind become build dependencies of a workspace app**, not of any
  published package. Nothing in `packages/` gains a dependency here.
- **The registry is the single source for component pages.** Changing what a page
  shows means changing the registry entry — which is the intended direction of
  control, and it means a page cannot quietly disagree with the CLI.
- **Search is offline and update-at-build.** A new component is searchable after
  the site is rebuilt, not instantly. For a versioned component library that is
  the correct trade; it would not be for user-generated content.
- **Live previews add hydration cost to those pages only**, because Astro ships no
  framework runtime by default.

## What would reverse this

**Interactive documentation that needs a server.** A theme editor that persists
per-user state, or a playground that shares links with a backend, would need
runtime storage. That would be an Astro SSR adapter or a second app — not a
reason to abandon the static site, but a reason to accept one dynamic route.

**Search quality.** If exact and prefix matching over a static index proves
inadequate at the size this catalogue reaches, the first step is better metadata
(synonyms in the registry entries, richer `whenToUse` text), *not* a hosted search
service — for the same reason `search_components` is a local index in ADR-015.

**A framework-native docs app.** The project already has a React package, and a
React docs app would let previews share code with it. That is a real argument for
previews specifically, and it is what islands are for; it is not an argument for
making the whole site a React app.
