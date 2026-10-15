---
"@santaka-ui/web-components": minor
---

plan.md section 17 asked for "Public TypeScript types and package exports
validate in clean consumer projects", and noted the gap honestly: attw --pack
and publint inspect the tarball, and neither can say whether
import "@santaka-ui/react" actually loads in a project that is not this one.

Every other check in this repository resolves through the workspace, which is
why three defects of one class shipped before this fixture existed: glass.css
built and absent from exports, 358 KB of CommonJS unreachable and unmeasured,
and CLI source mode resolving a path that existed only in the monorepo. All
three passed every test here.

tests/consumer/run.mjs packs all eight packages with pnpm pack, installs the
tarballs into a scratch project outside the workspace, and runs ten checks
covering export resolution, real imports, the loader's lazy contract, the
stylesheets, CommonJS reachability, the CLI and MCP server from the tarball,
TypeScript against the shipped declarations, and React server rendering.

It found a real defect on its first run. loader/cdn.js is a one-line CommonJS
shim — module.exports = require('../dist/cjs/loader.cjs.js') — that the exports
map never names, so it was unreachable and it pointed at a file
strip-cjs-output.mjs deletes. A dead CommonJS file violates the ESM-only
contract; a dead CommonJS file whose target does not exist is also a broken
artifact. It shipped in every tarball because nothing looked inside loader/.

Two checks exist only because the fixture can make them. A universal package
whose public types use Buffer or process forces every consumer to install Node
types, so the fixture compiles the universal packages with skipLibCheck: false
and no @types/node. And the loader must register nothing on import, because a
server render that upgrades the tags is ADR-005's R2 mismatch risk. Both are
negative-tested: removing ./glass.css from styles' exports fails two checks.

pnpm pack rather than npm pack, which is load-bearing: npm pack copies the
manifest verbatim, so the tarball keeps "@santaka-ui/styles": "workspace:^" and
a consumer install fails with a 404 for a package that is not published yet.
pnpm pack rewrites it to the real range.

.gitattributes now sets * text=auto eol=lf. Prettier is configured with
endOfLine: "lf", so a Windows checkout that converted endings made
prettier --check fail on files nobody had edited — which happened while
verifying this change, and is a confusing failure to hand the next person.
