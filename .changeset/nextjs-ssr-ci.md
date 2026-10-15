---
---

Enforce the Next.js SSR proof in CI, and record the framework capability states.

`examples/nextjs/scripts/ssr-proof.mjs` asserted the three claims that make the
SSR support matrix honest — server output carries the custom element tags with
their public attributes, no server chunk calls `customElements.define`, and the
tree hydrates clean with scoped styles already applied — but no CI job ran it.
A proof nothing runs is a claim nothing defends, so the Next.js target was
Preview in practice however it was written down. The `nextjs-example` job runs
it on every change; `plan.md` §3 now carries a State column and says why each
target is Stable, Preview, or Planned.

Three defects surfaced while wiring it, all of the same class: something worked
locally only because a previous build had left output on disk.

- **Neither example job built the workspace packages.** The examples consume
  `@santaka-ui/*` through their published `exports` maps, which point into
  `dist/` — and `dist/` is gitignored, so a fresh checkout has none. `vite build`
  failed with `Rolldown failed to resolve import "@santaka-ui/react"`, and
  `next build` would have failed the same way. The existing `react-example` job
  had this flaw from the day it was added; both jobs now build the packages
  first.
- **turbo never declared the Next.js build output.** `build.outputs` listed
  `dist`, `www`, `loader`, and `.stencil` but not `.next`, so turbo reported "no
  output files found for task @santaka-ui/example-nextjs#build" and the example's
  build was never cached. `.next/**` is now an output with `.next/cache/**`
  excluded — that subdirectory is Next's own incremental cache (67 MB of 69 MB
  here) and caching it twice buys nothing.
- **The docs site tests ran before the docs site was built.** `apps/docs` tests
  assert against `dist/` — the built pages, the bundled CSS, the Pagefind index,
  and the served registry payload — but the root `test` task depends only on
  `^build` (the dependencies' builds), not the package's own. On a cold checkout
  `apps/docs/dist` does not exist and all nine tests fail. `apps/docs/turbo.json`
  adds `build` to the `test` dependencies, so turbo orders core's build, the docs
  build, then the tests. The failure was reachable in CI and hidden locally.

Regenerating the registry payload also picks up the six component sources that
`4314314` changed without regenerating it: `sk-checkbox`, `sk-input`,
`sk-radio-group`, `sk-select`, `sk-switch`, and `sk-textarea`. The served copy
and the package's copy now match, which is what the docs test asserts.
