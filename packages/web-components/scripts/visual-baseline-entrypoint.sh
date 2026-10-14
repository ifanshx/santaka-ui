#!/usr/bin/env bash
# In-container entrypoint for the visual-regression baseline run.
#
# Runs inside mcr.microsoft.com/playwright, against a copy of the repository at
# /work with the host tree mounted read-only at /host. Never run this directly;
# packages/web-components/scripts/visual-baseline-docker.mjs invokes it.
#
# Why a copy: the host's node_modules holds Windows binaries, so installing
# against the mounted tree would replace them and break the host checkout.
set -euo pipefail

echo "[visual] copying the repository into the container"
mkdir -p /work
# Nested build and install directories are excluded by glob, not by naming a
# workspace member: dropping `examples/nextjs` entirely would leave the
# workspace smaller than the lockfile describes and `--frozen-lockfile` would
# refuse to install.
tar -C /host \
  --exclude='*/node_modules' \
  --exclude='node_modules' \
  --exclude='*/.next' \
  --exclude='.git' \
  --exclude='*/.turbo' \
  --exclude='.turbo' \
  --exclude='*/dist' \
  --exclude='*/loader' \
  --exclude='*/www' \
  --exclude='*/.stencil' \
  --exclude='*/test-results' \
  --exclude='*/playwright-report' \
  -cf - . | tar -C /work -xf -

cd /work
corepack enable

echo "[visual] installing"
pnpm install --frozen-lockfile

echo "[visual] building every package the example page loads"
# `turbo run build` at the root, not a filtered build. The example page loads
# four artifacts — the tokens CSS, the styles CSS, the web-components bundle,
# and the component CSS — and a filter only builds a package's *dependencies*.
# tokens and styles are dependencies of nothing in the web-components graph
# (styles depends on tokens, not the reverse), so a filtered build skipped both
# and the page rendered unstyled. That produced 57 baselines that all passed in
# `--update` mode while being worthless: an unstyled page has no theme, so the
# light and dark shots were byte-identical. The full build is the fix; the
# theme-difference check in the verify path is the guard against it returning.
pnpm run build

echo "[visual] running the visual project (${MODE_ARGS:-verify})"
# shellcheck disable=SC2086
pnpm --filter @santaka-ui/web-components test:visual ${MODE_ARGS}

# Copying back is gated on update mode on purpose. In verify mode a failing
# comparison leaves the *actual* image at the snapshot path, so an unconditional
# copy would quietly overwrite the baseline with the diff it just rejected.
SNAP=/work/packages/web-components/e2e/visual.visual.ts-snapshots
if [ -n "${MODE_ARGS:-}" ] && [ -d "$SNAP" ]; then
  echo "[visual] copying snapshots to the host mount at /out"
  cp -f "$SNAP"/*.png /out/
  echo "[visual] wrote $(ls -1 /out/*.png | wc -l) baselines"
fi
