# ADR-007: Registry hosting model — static versioned JSON, not a live endpoint

- **Status:** Accepted
- **Date:** 2026-10-15
- **Plan deadline:** end of weeks 5–6 (`plan.md` §18)

## Context

`plan.md` §9 requires "Public and private registries with explicit trust
boundaries", and §8 gives the CLI a `registry add <registry-url>` command. The
open question §18 asks this record to settle is whether a registry is **static
versioned JSON** or a **live endpoint** — a service that answers queries, accepts
submissions, and resolves versions at request time.

The CLI already has the code path for both; what it did not have was the
decision. `fetchRemoteRegistry(url)` fetches `{ items: [...] }` and validates
every entry, and the bundled registry satisfies the same shape from disk. So the
question is not "can we" but "which one do we ship".

## Evidence

**The data only changes when a component ships.** Registry entries are generated
by `packages/core/scripts/generate-registry.mjs` during the build, and their
`files[].checksum` values are hashes of the published source. There is no
mutation between releases — no submissions, no ratings, no downloads counter to
increment. A live endpoint would exist to serve reads of a file that is written
once per release.

**§11 already committed to the static position for the AI surface.** "The
tooling serves validated JSON. No model is called at build time or at query time,
and nothing in this section requires a hosted service." A live registry would put
a hosted service directly under that claim.

**The schema has nowhere to put an action.** There is no field in
`registry-item-v1` that names a script, a webhook, or a mutation. §9's safety
rules forbid executing registry content, so a registry endpoint's only verb would
be `GET`. A service whose only verb is `GET` is a file server with a database
behind it.

**A live endpoint has costs this project cannot yet pay.** Authentication,
rate limiting, uptime, a database with a migration story, abuse handling for
published entries, and an on-call rotation. Every one of those exists to solve a
problem that static files do not have.

**Static has a real cost of its own, and it is not zero.** A consumer who wants
one component's metadata downloads the whole index. At 21 components that is
70 KB of JSON — fine. At 400 it is not, and the answer then is per-component
files plus an index of names, not a query service.

## Decision

**Static versioned JSON, published as build output. Private registries are the
same shape at any URL the consumer names.**

### What is published

The registry payload is emitted under `apps/docs/public/registry/`, next to the
`llms.txt` files the docs site already serves:

```
registry/
  index.json                 # the current aggregate: { version, items: [...] }
  v0.1.0/
    index.json               # the same document, immutable, for a pinned consumer
    button.json              # one entry, for a consumer who wants one
    …                        # 21 entries
  button.json                # current, for a consumer who wants one now
  …
```

The versioned directory is immutable: once `v0.1.0/` is published it never
changes, so a consumer can pin `…/registry/v0.1.0/index.json` and know it will
not move. The top-level files are the current release and may be replaced.

### The shape is one document

A registry document is `{ version, items: RegistryItem[] }` — the same shape
`@santaka-ui/core/registry` exposes from disk, and the same shape the CLI's
`fetchRemoteRegistry` already parses. There is no second format for the remote
case, which is what lets the bundled registry and a remote one flow through one
code path with one validator.

### Private registries are static files too

A private registry is the same directory served from wherever a company serves
its internal assets — an S3 bucket, an internal CDN, a file server. The CLI
takes the URL and reads it; there is no API key format to invent, because
whatever access control is needed is the existing access control of wherever
those files live. This is the "explicit trust boundary" §9 asks for: the boundary
is the URL the developer typed, not a token.

### Trust is validated, not granted

`fetchRemoteRegistry` validates every entry against `registry-item-v1` and
returns rejected entries for reporting rather than dropping them silently. That
validation is not review, and the CLI says so verbatim when a registry is added:

> Registry content is untrusted until you have reviewed it. It is validated
> against the schema, which is not the same as reviewed.

This is the sentence the ADR exists to make permanent. A registry that passes
schema validation is *well-formed*; it is not *safe*. The distinction is the only
thing standing between `santaka registry add <some-url>` and arbitrary file writes
in a consumer's repository, alongside the path and checksum checks in ADR-009.

### Bundled entries win a name collision

If a remote registry ships an entry whose name matches a bundled one, the bundled
entry is used. The reviewed, checksummed, in-repo copy is the one to install; a
third party cannot silently shadow a shipped component by claiming its name.

## Consequences

- **No hosted service.** Nothing in this repository needs a database, an auth
  provider, or an on-call rotation to serve the registry. The docs site serves
  files.
- **A consumer who wants one component still downloads the index**, unless they
  address `…/registry/<name>.json` directly. The per-component files exist so a
  scripted consumer can avoid the whole document.
- **Publishing is a build step.** The registry payload is generated, checked, and
  committed from the build — it cannot drift from `@santaka-ui/core`'s registry
  because it is generated from it.
- **The CLI's remote path is now exercised end to end**, rather than being a
  branch no test reaches.

## What would reverse this

**A registry that accepts submissions from third parties.** The moment
publishing is open rather than a build step, writes need authentication, review
workflow, and moderation — and a static directory cannot do any of that. That is
a product decision with an abuse story attached, not an infrastructure swap.

**Scale.** If the index grows past the point where downloading it is reasonable,
the fix is splitting by type and namespace (`registry/component/index.json`) and
adding an index of names, not adding a query service. A query service becomes the
right answer only when consumers need to *search* rather than *fetch* — and
`search_components` in `@santaka-ui/mcp` already does that locally, from a
downloaded index, with no network call at query time.
