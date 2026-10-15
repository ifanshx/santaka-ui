# Changesets

This directory holds one Markdown file per pending change. Each file names the
packages it affects and the bump they need. `changeset status` in CI fails when a
pull request modifies a package but carries none.

## Adding one

```bash
pnpm exec changeset
```

Pick the packages, pick the bump, and write one sentence describing the change
from the consumer's point of view.

## What a bump means here

| Bump | When |
|---|---|
| `patch` | Bug fix, no API change |
| `minor` | Backwards-compatible addition |
| `major` | A breaking change; see `docs/MIGRATIONS.md` |

A changeset with no packages listed (`---` / `---`) is valid and is used for
changes that affect the repository but no published package — tooling, CI, and
documentation.
