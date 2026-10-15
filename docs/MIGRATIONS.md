# Migrations

Nothing has been published to npm yet, so **there is nothing to migrate from.**
This file exists so the first migration is not written under time pressure, and so
the shape of a breaking change is agreed before one ships.

Under `0.x` a breaking change is a minor bump. Read
[RELEASE.md](./RELEASE.md#what-each-bump-means) for what counts as breaking.

## The shape of a migration entry

Every breaking change gets an entry with four parts. The fourth is the one people
skip, and the one that decides whether the migration is adopted or worked around.

```
### <package> <from> → <to>

**What changed.** One paragraph, in terms of the public API, not the diff.

**Why.** The reason it was worth breaking. A migration with no stated reason reads
as carelessness, and an adopter who disagrees with the reason cannot tell whether
the change is going to be reverted or repeated.

**Before / after.** Two short snippets. Not prose about the snippets — the
snippets.

**Codemod.** Available, or explicitly not. "Not available" is a valid answer and
much better than silence, because it tells the adopter to budget time.
```

## Categories, and what each promises

| What changed | What the migration owes the adopter |
|---|---|
| Prop renamed | The old name, the new name, and whether the old one warns before it stops working. |
| Prop removed | What to use instead. If nothing, say so. |
| Event renamed | Both names, and whether both are emitted for a release. |
| Default value changed | The old value, the new value, and the visual or behavioural difference. |
| Token renamed or removed | The old name, the new name, and whether an alias exists. |
| Behaviour changed | The observable difference, and who is affected. |

## Deprecation, where it is possible

The preferred path for a rename is three releases, because an immediate break gives
no warning and a silent one gives no signal:

1. **Add** the new name. Emit or accept both. Warn on the old one.
2. **Deprecate** the old one in the types and the docs.
3. **Remove** it, in a version whose changelog entry links here.

This is not always possible — a component whose contract is wrong cannot carry the
wrong contract for two more releases — but it is the default, and skipping it is a
decision that goes in the "why".

## Registry and CLI migrations

Two paths are specific to this project.

**Source-mode components (ADR-009).** If you ran `santaka add` and then edited the
copied files, `santaka update` will not overwrite your edits: it prints a unified
diff and exits `2`, and you choose `--overwrite` or `--skip`. That conflict rule is
the migration mechanism for source-mode adopters — there is no separate migration
tool, because the diff *is* the migration.

**Registry schema versions.** A registry entry is validated against
`registry-item-v1`. A `v2` schema is a new document, not an in-place change, and
the CLI reports entries that fail validation rather than dropping them. Adopters
pinning a registry URL can stay on the old schema by keeping the pinned path
(`registry/v0.1.0/index.json`), which is why the versioned directory exists
(ADR-007).

## Pre-1.0 caveat

Until `1.0.0`, the realistic advice is in RELEASE.md: pin the version, and read the
changelog before any minor bump. This file is where the work will be when there is
a `1.0.0` to migrate to.

## Template

```markdown
### @santaka-ui/web-components 0.2.0 → 0.3.0

**What changed.** `sk-select` no longer accepts `placeholder`; it accepts
`placeholder` on the native control, which it always forwarded.

**Why.** The prop was documented as the component's own and was actually the
native attribute, which made the types lie about where the value landed.

**Before**

```html
<sk-select placeholder="Choose"></sk-select>
```

**After**

```html
<sk-select placeholder="Choose"></sk-select>
```

Unchanged in markup; update types only.

**Codemod.** Not needed.
```
