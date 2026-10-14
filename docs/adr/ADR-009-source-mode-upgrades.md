# ADR-009: Source-mode upgrade path for locally modified components

- **Status:** Accepted
- **Date:** 2026-10-15
- **Plan deadline:** with the first CLI release (`plan.md` §18)

## Context

`plan.md` §8 offers two distribution modes, and the choice is not about
convenience:

- **Package mode** — install versioned npm packages. Upgrades are the package
  manager's problem, and the consumer's copy is immutable.
- **Source mode** — copy the component's files into the consumer's repository.
  This is the mode the project's principles call for ("code ownership"), and it
  creates a problem no package manager has: **once the files are in the
  consumer's repo, they are the consumer's files.** They will edit them. That is
  the point. So the CLI has to answer a question that has no package-manager
  analogue:

  > The registry has a newer version of a file the consumer has edited. What
  > happens?

Every wrong answer is destructive. Overwriting silently loses work and is
discovered later, in a diff nobody expected. Refusing to update ever makes the
component un-upgradable. Treating "the file changed" as "the consumer changed it"
is wrong too, because the CLI's own earlier write also changed it.

This ADR records the answer the CLI implements. §18 places the deadline with the
first CLI release because the manifest format is a compatibility surface — it
lives in the consumer's repository, and changing it later means migrating every
install.

## Decision

### The manifest records what the CLI wrote, not what the registry ships

`santaka-manifest.json` at the project root:

```json
{ "version": 1, "items": { "button": { "version": "0.1.0", "files": { "src/components/sk-button/sk-button.css": "sha256-…" } } } }
```

The hash is of the bytes **the CLI wrote**. That is the only formulation that
answers the question actually being asked — "has the consumer changed this since
we wrote it?" — rather than "does this still match upstream?", which is a
different question with a different answer and a much worse failure mode. If the
manifest tracked upstream, every upstream release would look like a consumer edit.

### A modified file is never overwritten without consent

`plan.md` §8's rule, and the CLI enforces it as an exit code:

| Situation | Behaviour |
|---|---|
| File matches the manifest hash | Replace it. The consumer has not touched it. |
| File differs from the manifest hash | **Conflict.** Print a unified diff, exit `2`, write nothing. |
| File exists with no manifest record | **Conflict.** The CLI cannot know what it is, so it cannot replace it. |
| File recorded but deleted | Report as `missing`; do not recreate it silently — deletion was deliberate. |

Exit code `2` rather than `1` is deliberate and load-bearing: §8 makes `santaka
diff` a CI check that exits `2` on drift, and a script needs to distinguish
"drifted" from "crashed".

The consumer then chooses `--overwrite` (replace) or `--skip` (leave it, install
the rest). Detection and stopping are separate: a conflict is always reported,
but it only stops a run that has not been told how to proceed.

### `--skip` does not rewrite the manifest

The subtle case, and the one a first implementation gets wrong. When a run skips
a file, the manifest must keep the hash of the **last bytes the CLI wrote**, not
the bytes on disk. Otherwise the drift disappears from the record the moment the
consumer chooses to keep it, and the next `diff` reports clean on a file that is
not what the registry shipped.

Verified in `cli.test.mjs`: `add --skip` leaves the consumer's edit intact and the
following `diff` still exits `2`.

### A run either completes or leaves nothing behind

Writes go through a journal (`fs-safe.ts`): every destination is backed up to a
temporary sibling before it is replaced, and a failure replays the journal
backwards — replaced files restored, created files removed, directories the run
created pruned. The manifest is written **after** the files land, so a failed run
leaves the previous manifest intact and is always safe to repeat.

This is not a `try`/`catch` per file. A per-file rollback leaves the earlier files
of the same run in place, which is the half-installed state the rule exists to
prevent: the consumer cannot tell which half they have.

### The registry is untrusted, and validation is not review

A registry entry's `files[].path` is a string a third party wrote. It is resolved,
normalized, and confirmed to stay inside the target directory before anything is
written, and the check is `relative()` rather than a string prefix — a prefix test
accepts `/project-evil` for `/project` and `/project/../project-evil` for
`/project`.

Two independent checks run on every file:

1. The **destination** stays inside the project root.
2. The **source** file's bytes hash to the entry's declared `checksum`. A
   mismatch stops the install rather than writing bytes nobody vouched for.

Remote registries (`santaka registry add <url>`) are validated against the same
schema as the bundled ones. `registryAdd` prints, verbatim, that *"Registry
content is untrusted until you have reviewed it. It is validated against the
schema, which is not the same as reviewed."* That sentence is the decision: schema
validation makes an entry well-formed, not trustworthy, and a CLI that conflated
the two would be handing a security property to a JSON Schema.

No registry content is ever executed. There is no field in the schema that names
a script, and the CLI only ever reads JSON and copies bytes.

### Source mode requires publishing the source

The registry's `files[].path` values are `src/components/<tag>/<tag>.{tsx,css}`,
so `@santaka-ui/web-components` now publishes `src/components/` alongside `dist/`.
Without it, source mode could only work inside this monorepo — it would pass every
test here and fail for every consumer, which is the defect class ADR-012's
distribution contract exists to catch. The CLI resolves the tree through
`require.resolve("@santaka-ui/web-components/package.json")`, so the workspace and
the published tarball take the same path.

### `update` is `add` with the recorded names

Not a second implementation. Two code paths for "install these files, respecting
the conflict rule" is how the two drift until one of them overwrites something.
`update` reads the manifest and calls `add`.

## Consequences

- A consumer who never edits a component gets clean upgrades. A consumer who does
  gets a diff and a decision, every time, which is the cost of owning the code.
- The manifest format is a compatibility surface from this release. `version: 1`
  is written explicitly so a future change can detect and migrate an old file
  rather than misreading it.
- The CLI is deliberately narrow: it does not install dependencies. §8 requires it
  to *document* CSS and build requirements, and running a package manager from a
  scaffolder means the tool can no longer tell a network failure from a permission
  failure from a version conflict. It prints the command instead.
- `--framework` overrides detection without silencing it. A project detected as
  Next.js but initialised as `vanilla` prints both, because the user may know
  something the files do not say, and the reviewer of that decision should see
  what the files said.

## What would reverse this

**A three-way merge.** With the upstream base recorded as well, a consumer edit
and an upstream change could be merged rather than confronted. It is the right
answer for a mature source-mode ecosystem and the wrong one now: a merge tool in
a design-system CLI is a large surface with its own failure modes, and the honest
alternative — show the diff, let the person decide — is what the tool does today.
The manifest would need a third hash per file, which is why the format carries a
`version`.

**Content-addressed upgrades**, where a file's identity is its hash and a
"conflict" is simply a file whose hash is not in the set the CLI has written. That
is a cleaner model than a manifest and it needs a store the CLI does not have;
it is worth revisiting if the manifest proves to be the wrong shape in practice.
