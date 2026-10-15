---
"@santaka-ui/docs": patch
---

The docs typecheck was a false green: `apps/docs` declared a `typecheck` script
and `pnpm run verify` ran it, but `@astrojs/check` — the package `astro check`
delegates to — was not a declared dependency. `astro check` could not resolve its
own checker and exited 0, so the gate passed without checking a single `.astro`
file. A check that reports success while doing nothing is worse than no check:
the exit code claimed coverage it did not have.

Declaring and installing `@astrojs/check` made the check run for real, and it
immediately found 20 type errors that had never been seen. All twenty are fixed
with real types rather than suppressions:

- `astro.config.mjs` — `resolvePackage` parameters are typed with JSDoc (the file
  is `.mjs`; type annotations are not valid syntax there).
- `src/lib/components.ts` — the registry index is read as `RegistryIndex` and its
  items as `RegistryItem` from `@santaka-ui/core`, so the derived pages are
  checked against the same contract the CLI and MCP server use.
- `src/components/Search.astro` — the Pagefind runtime surface is declared in
  `src/lib/pagefind.ts` and imported, replacing an implicit `any`. The bundle
  specifier is held in a variable so it stays dynamic: the file exists only after
  the Pagefind step, and a literal specifier is reported as a missing module.

`astro check` now reports 0 errors over 12 files.
