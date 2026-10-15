---

---

ADR-006 settles section 10 with section 5's already-recorded defaults and the
reasoning behind them. Astro with content collections, because the content is
static and the registry is the source. Pagefind, because section 11 already ruled
out a hosted service for the AI surface and a SaaS search index would be the same
dependency in a different place. Static by default with preview islands, because
section 10 wants live previews and Astro hydrates only what needs it.

The decision was overdue rather than premature. apps/docs/public/ is already
written to on every build — it carries llms.txt, llms-full.txt, and the registry/
payload — so the framework question had a live answer to bind, and the
directory's contents constrain the choice.

The invariant ADR-006 commits to is now tested. Component pages come from the
registry rather than being hand-written, which means a prop renamed in a
component must reach the docs, the CLI, the MCP server, and llms.txt together or
not at all. tests/registry/docs-source.test.mjs asserts exactly that: the
published payload is the registry, every summary and example appears in the
generated reference, every declared prop appears there, no prop appears that no
component declares, events appear, and stability is shown because it is data.

Negative-tested by renaming one prop in the docs alone (variant -> appearance):
the "no documented prop is invented" test fails, which is the hand-edited page
this ADR exists to prevent.

All eighteen section 18 ADRs are now recorded.
