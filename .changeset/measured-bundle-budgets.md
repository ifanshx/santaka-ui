---
"@santaka-ui/core": minor
"@santaka-ui/web-components": patch
---

`@santaka-ui/core` no longer ships Ajv. `validateRegistryItem` compiled the registry schema with a fresh `Ajv2020` instance at module load, which put 41.2 KB gzipped into every CLI command for a schema that cannot change at runtime. The validator is generated at build time by `scripts/build-validator.mjs` from the same schema, and `ajv` moved to `devDependencies`. The package measures 4.4 KB now, and the `tokens + core` budget row — which had never been measured and was recorded as an open gap in ADR-010 — reads 7.44 KB of 8 instead of failing by five times.

The generated module is bundled with esbuild rather than written straight from Ajv's standalone output, because that output still `require`s Ajv's `ucs2length` helper and would have been a CommonJS hole in an ESM package. Behavior is unchanged; `validate-item.test.ts` and the 157 registry tests are the evidence, not the assertion.

`measure-bundle.mjs` also measures the two rows §12 had never measured. The ten-component row could not be met: the verified floor is 25.76 KB for `tokens + any 10 components`, before `core` is counted, so no selection of ten fits 25 KB. It is gated at 27 KB — the floor with the ~4% headroom ADR-010 sets as this table's rule — and the readings that name `core`, plus the ten largest components, print as `info` and gate nothing. ADR-023 records the change.
