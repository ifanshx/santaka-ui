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
| `minor` | New component, new prop, new optional export |
| `major` | Removed or renamed public API, changed behavior, changed defaults |

`0.x` releases may break freely; the policy is in section 14 of `plan.md`.

## Writing the sentence

Write it for someone reading the changelog in six months:

- ✅ "`Button` no longer submits its form when `loading` is true."
- ❌ "fixed the click handler bug in sk-button.tsx"

Do not mark `web-components` alone when a React consumer sees the change — the
packages ship together, and a fix in the behavior owner belongs in the changelog
of both.