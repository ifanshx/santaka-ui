# Deploying the documentation site

The docs are a static Astro build: `apps/docs` produces `apps/docs/dist`, a
2.4 MB directory of HTML, CSS, and a Pagefind search index. No server, no
runtime, no database. Anything that serves files can host it.

This file is written for whoever runs the deploy — a home server, a CI job, or a
human with an SSH key. It states the constraints first, because two of them
decide which host you can use at all.

## Two constraints to know before choosing a host

**1. It must be served from a domain root, not a subpath.**

The build emits absolute asset paths (`/_astro/index.D6A7zbHe.css`). That is
deliberate — the registry payload and `llms.txt` are linked absolutely too — but
it means the site cannot be mounted at `https://example.com/santaka/`. It needs
`https://santaka.dev/` or a subdomain like `https://docs.santaka.dev/`.

If you do want a subpath, set `base` in `apps/docs/astro.config.mjs` and rebuild;
do not hand-edit the output.

**2. `site` currently claims a domain the project does not own.**

`apps/docs/astro.config.mjs` sets `site: "https://santaka.dev"`, and the registry
schema IDs (`$schema`, `$id`) use the same host. `santaka.dev` does not resolve —
it is unregistered. Nothing breaks at runtime, but until the domain is bought and
pointed at the host, any canonical or schema URL the site advertises is dead.

Either buy the domain, or change `site` to the host you actually use. Do not
deploy and leave the mismatch: a search engine that indexes a dead canonical is
harder to fix than a config line.

## What the build produces

```bash
pnpm install
pnpm exec turbo run build --filter=@santaka-ui/docs
```

Output, all of it under `apps/docs/dist`:

| Path | What it is |
|---|---|
| `index.html` | Landing page |
| `components/<name>/index.html` | One page per registry component — 38 of them |
| `blocks/<name>/index.html` | One page per block — 3 |
| `guides/*/index.html` | Accessibility, CLI, forms, SSR, theming |
| `pagefind/` | The search index, built from the pages |
| `llms.txt`, `llms-full.txt` | Generated from the registry for AI tooling |
| `registry/` | The versioned registry payload the CLI reads |

The build is deterministic: the same source produces the same bytes, which is
what the `llms` and `support-matrix` CI jobs rely on.

## Option A — any static host (recommended)

Because the output is plain files, the deploy is: build, then copy `dist/` to
wherever the web server serves from.

```bash
# On the machine that builds
pnpm exec turbo run build --filter=@santaka-ui/docs

# Copy the tree; --delete removes pages that no longer exist
rsync -av --delete apps/docs/dist/ user@host:/var/www/santaka/
```

Then point the web server at `/var/www/santaka`. Two details matter for a
single-page-style static site:

**Cache headers.** `_astro/` filenames are content-hashed, so they can be cached
forever. `index.html`, `llms.txt`, and `registry/*.json` must not be.

```nginx
server {
    root /var/www/santaka;
    index index.html;

    # Content-hashed assets: safe to cache permanently
    location /_astro/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Everything else: revalidate, because a registry update must be visible
    location / {
        try_files $uri $uri/ $uri/index.html =404;
        add_header Cache-Control "public, max-age=0, must-revalidate";
    }

    types { application/json json; }
}
```

**Compression.** The Pagefind index and the registry JSON compress well.

```nginx
gzip on;
gzip_types text/css application/javascript application/json text/plain image/svg+xml;
```

Caddy is equivalent and shorter:

```
santaka.dev {
    root * /var/www/santaka
    encode gzip
    try_files {path} {path}/ {path}/index.html
    file_server
    header /_astro/* Cache-Control "public, max-age=31536000, immutable"
}
```

## Option B — GitHub Pages

Works, but only on a **custom domain or a `*.github.io` root**, because of
constraint 1. `https://ifanshx.github.io/santaka-ui/` will not work without a
`base` change.

1. Buy and point a domain at GitHub Pages (a `CNAME` record to
   `<owner>.github.io`).
2. Add `apps/docs/public/CNAME` containing the bare domain, one line.
3. Set `site` in `astro.config.mjs` to that domain.
4. Publish `apps/docs/dist` to the `gh-pages` branch, or enable Pages with
   "GitHub Actions" as the source and add a job that uploads the artifact.

A workflow for the artifact route, added to `.github/workflows/` as
`docs.yml`:

```yaml
name: Docs

on:
  push:
    branches: [main]
    paths: ["apps/docs/**", "packages/core/registry/**", "packages/web-components/**"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22.12.0
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      # The docs import the registry and the element types, so their builds come
      # first — the same ordering the `browsers` job needed.
      - run: pnpm exec turbo run build --filter=@santaka-ui/docs
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: apps/docs/dist
      - id: deploy
        uses: actions/deploy-pages@v4
```

## Option C — Netlify, Vercel, Cloudflare Pages

All three host this without configuration beyond the build command. They exist
as an option, not a recommendation: the point of this project is that it does not
need a platform.

| Setting | Value |
|---|---|
| Build command | `pnpm exec turbo run build --filter=@santaka-ui/docs` |
| Output directory | `apps/docs/dist` |
| Node version | 22.12.0 |
| Install command | `pnpm install --frozen-lockfile` |

Set the custom domain in the platform's dashboard, then make `site` in
`astro.config.mjs` match it.

## Verifying a deploy

A deploy is not done when the files land. Check these, in this order — each one
has been wrong in a real static deploy at some point:

```bash
# 1. The page loads and the CSS applied (absolute paths resolve)
curl -sI https://<host>/ | head -1
curl -s https://<host>/ | grep -o '/_astro/[^"]*\.css' | head -1 | \
  xargs -I{} curl -sI https://<host>{} | head -1

# 2. A component page exists for every registry entry
curl -s https://<host>/registry/index.json | \
  node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{
    const n=JSON.parse(d).items.filter(i=>i.type==="component").length;
    console.log("registry components:", n)})'
curl -sI https://<host>/components/slider/ | head -1

# 3. Search works (the Pagefind index shipped)
curl -sI https://<host>/pagefind/pagefind.js | head -1

# 4. The AI surfaces resolve
curl -sI https://<host>/llms.txt | head -1
curl -sI https://<host>/llms-full.txt | head -1

# 5. The registry schema URL the CLI advertises is live
curl -sI https://<host>/registry/index.json | head -1
```

If step 2 returns 404 for a component that exists in the registry, the deploy
copied a stale `dist/` — rebuild rather than re-upload.

## What is not ready to deploy

Two things a reader will notice, and neither is a hosting problem:

- **The packages are not on npm.** Every install line in the docs
  (`pnpm add @santaka-ui/web-components`) fails with 404 until the scope is
  registered and `0.1.0` is published. See the publication section below.
- **The keyboard review is unfinished.** `manual-keyboard-review.astro` ships a
  checklist with an empty sign-off table. It is honest, but it is not a finished
  accessibility claim.

## Publishing the npm scope

Not a deploy step, but the docs are useless without it, and it is the one thing
that cannot be done from a script on this repository's behalf.

```bash
# 1. Log in as the account that will own the scope
npm login

# 2. Claim the scope by creating the org on npmjs.com:
#      npmjs.com → Add Organization → name: santaka-ui → plan: free
#    The scope @santaka-ui becomes available to that org immediately.
#    Verified unclaimed as of 2026-10-23: `npm view @santaka-ui/core` → 404,
#    and the registry reports "Scope not found".

# 3. Verify you are the owner
npm access list packages @santaka-ui 2>/dev/null || true
npm org ls santaka-ui

# 4. Publish, in dependency order — the CLI and MCP depend on core
pnpm exec turbo run build
pnpm -r --filter='./packages/*' publish --access public --provenance

# Or let the existing workflow do it, which is the supported path:
#   .github/workflows/publish.yml runs on a published release and uses
#   npm provenance via OIDC, so the packages carry a verifiable build attestation.
```

The `publishConfig` in all ten packages already sets `access: public` and
`provenance: true`, so a plain `npm publish` from each package directory also
works.

Do not publish before the manual keyboard review is signed off. `docs/RELEASE.md`
treats it as a release gate, and the one thing worse than shipping late is
shipping an accessibility claim the project has not verified.
