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
it means the site cannot be mounted at `https://example.com/santaka/`. It needs a
domain root — `https://santaka.my.id/` is one, which is why serving the apex
domain avoids this problem entirely.

If you do want a subpath, set `base` in `apps/docs/astro.config.mjs` and rebuild;
do not hand-edit the output.

**2. The canonical host is `https://santaka.my.id`.**

`apps/docs/astro.config.mjs` sets `site` to it, and the registry schema IDs
(`$schema`, `$id`) use the same origin. The apex domain is what makes
constraint 1 a non-issue — `santaka.my.id` is a domain root, so the absolute
asset paths resolve.

Changing the host means changing it in four places, all of which are checked by
tests: `apps/docs/astro.config.mjs` (`site`), `packages/core/src/registry-item-schema.ts`
(`REGISTRY_ITEM_SCHEMA_ID`), `packages/core/scripts/generate-registry.mjs` (the
`$schema` each entry advertises), and `packages/core/scripts/build-registry-index.mjs`
(the index `$schema` and `$id`). Rebuild `core` afterwards — the schema files and
the published payload are generated from those values.

The schemas are published at `/schema/` in the docs output, so the URL an entry
advertises has a file behind it. That was not true before: the schema files were
written to `packages/core/schema/` and never copied into the published tree, and
the index pointed at `./index.schema.json`, a file that was never written. Both
are now generated into the payload and guarded by `tests/registry/remote.test.mjs`.
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
| `schema/` | The JSON Schemas every registry entry advertises via `$schema` |
| `404.html` | What a static host serves for an unknown path |

The build is deterministic: the same source produces the same bytes, which is
what the `llms` and `support-matrix` CI jobs rely on.

## Option 0 — Cloudflare, with the domain already owned

The project owns `santaka.my.id` on Cloudflare, so `santaka.my.id` is the
cheapest correct host: an apex domain is a domain root for the purposes of
constraint 1, and DNS and TLS are already there.

Two ways, pick one.

### 0a. Cloudflare Pages (no server to run)

| Setting | Value |
|---|---|
| Production branch | `main` |
| Build command | `pnpm exec turbo run build --filter=@santaka-ui/docs` |
| Output directory | `apps/docs/dist` |
| Root directory | *(repository root — the build needs the workspace)* |
| Environment variable | `NODE_VERSION=22.12.0` |
| Build cache | disabled — a stale `dist/` is worse than a slow build |

Then in **Workers & Pages → the project → Custom domains**, add
`santaka.my.id`. Cloudflare creates the record and issues the certificate.

On an apex domain Cloudflare flattens the CNAME automatically, so no A record is
needed — but the record must be **proxied** (orange cloud), not DNS-only, or the
certificate is not issued for the hostname.

Pages needs `_headers` and `_redirects` in the output root for cache policy. Add
`apps/docs/public/_headers`:

```
/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/*
  Cache-Control: public, max-age=0, must-revalidate
```

### 0b. Cloudflare Tunnel to your own server (matches your setup)

If the deploy runs on your home server, do not open a port — run a tunnel.

```bash
# On the home server
cloudflared tunnel create santaka-docs
cloudflared tunnel route dns santaka-docs santaka.my.id

# Serve the built directory directly; no nginx needed
cloudflared tunnel run --url http://localhost:8080 santaka-docs
```

And serve the files on 8080:

```bash
cd /srv/santaka-docs && python3 -m http.server 8080 --bind 127.0.0.1
```

A tunnel is a better fit than an exposed port because the origin stays private
and Cloudflare terminates TLS. Two things to set at the edge:

- **Cache Rule:** `/_astro/*` → Edge TTL 1 year, Browser TTL 1 year (the names
  are content-hashed).
- **Cache Rule:** everything else → bypass cache, or Edge TTL 0. A cached
  `registry/index.json` would serve a stale registry to the CLI.

Cloudflare serves `.json` as `application/json` and compresses text automatically,
so no header configuration is needed beyond the cache rules.

### Verify the domain before announcing it

```bash
dig +short santaka.my.id
curl -sI https://santaka.my.id/ | head -1
curl -s https://santaka.my.id/ | grep -o "/_astro/[^"]*.css" | head -1
```

The third command is the one that matters: if it prints nothing, the asset paths
do not resolve and the page is unstyled — the failure mode constraint 1 warns
about.
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
santaka.my.id {
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

## Option C — Netlify or Vercel

Both host this without configuration beyond the build command. They exist
as an option, not a recommendation: the point of this project is that it does not
need a platform. Cloudflare Pages is covered in Option 0a because the domain is
already there.

| Setting | Value |
|---|---|
| Build command | `pnpm exec turbo run build --filter=@santaka-ui/docs` |
| Output directory | `apps/docs/dist` |
| Node version | 22.12.0 |
| Install command | `pnpm install --frozen-lockfile` |

Set the custom domain in the platform's dashboard, then make `site` in
`astro.config.mjs` match it.

## What the deploy host needs installed

The build is a pnpm workspace, so a host with the wrong toolchain fails before
it reaches Astro. These are pinned in the repository, not chosen by the host:

| Requirement | Value | Where it is pinned |
|---|---|---|
| Node | `>=22.12.0` | `engines.node` in the root `package.json` |
| pnpm | `10.34.7` | `packageManager` in the root `package.json` |
| turbo | `2.11.7` | `devDependencies.turbo` — `pnpm exec` finds it, no global install |

`corepack enable` is the one-line way to get the pinned pnpm rather than
whatever the host ships. Node 22.11 is not enough: Astro refuses to build on it
and says so by name.

The docs build depends on three workspace packages — `core`, `mcp`, and
`web-components` — because the registry payload and the element types come from
them. `--filter=@santaka-ui/docs` builds those first through the task graph, so
there is no separate build step to remember.

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

# 4. The 404 page is served for an unknown path (not the host default)
curl -s https://<host>/components/does-not-exist/ | grep -c "Not found"

# 5. The schema an entry advertises is reachable
curl -s https://<host>/registry/index.json | node -e 'let d="";
  process.stdin.on("data",c=>d+=c).on("end",()=>{
    console.log(JSON.parse(d).$schema)}) '
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
