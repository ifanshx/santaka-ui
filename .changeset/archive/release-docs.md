---

---

CHANGELOG.md records what has landed since the foundation: the MCP server, CLI,
and docs site as new packages; the form controls, registry payload, llms.txt,
support matrix, visual regression, consumer fixture, touch targets, and dependency
audits as capabilities; and five fixes including loader/cdn.js and the verify
flake. Honest about the central fact — no release has been published, all nine
packages at 0.1.0.

docs/RELEASE.md makes section 14 concrete. What each bump means, with the test for
"breaking" stated as whether adopting code has to change rather than how large the
diff is. What counts as public API, and what does not — which is why deleting
unreachable CommonJS needed no release note. Coordinated publishing, with tokens
and styles versioned together and adapters free to track their own maturity.

docs/MIGRATIONS.md states the shape of a migration entry and why the fourth part
is the one people skip. Honest that there is nothing to migrate from yet, because
the first migration should not be written under time pressure.

A policy decision it forced: updateInternalDependencies is now "minor", not
"patch". When the components package gains a component, the React adapter has
gained it too — a feature, not a fix. Publishing only a patch would tell adopters
nothing changed while the component set grew.

tests/registry/release-docs.test.mjs asserts the documents are consistent with the
repository rather than merely present: the policy's stated rule matches the config,
the changelog's version claim matches every package, every link resolves, and every
publishable package appears in the policy's scope. The last failed first —
@santaka-ui/cli was absent — which is the drift the test exists to catch.

Two bugs in the test file, both producing errors that pointed at the wrong thing:
resolve(here, "..") was one level short so paths landed in tests/packages, and
passing an absolute path through a joining helper concatenated instead of
discarding it.
