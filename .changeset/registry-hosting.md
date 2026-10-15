---
"@santaka-ui/core": minor
---

plan.md section 9 asked for "public and private registries with explicit trust
boundaries" and section 8 gave the CLI a `registry add <url>` command. What was
missing was the decision, and the CLI already had code for both.

Static versioned JSON, not a live endpoint. The payload is build output under
apps/docs/public/registry/: a current index.json, an immutable v<version>/
directory for pinned consumers, and one file per component so a scripted consumer
need not fetch the whole index. A private registry is the same directory served
from wherever a company serves internal assets, so the trust boundary is the URL
the developer typed, not an API key format to invent. Bundled entries win a name
collision, so a third party cannot shadow a shipped component by claiming its name.

Why static: the data changes only when a component ships, with no mutation between
releases. Section 11 already committed the project to this position for the AI
surface. The schema has nowhere to put an action, so a registry endpoint's only
verb would be GET. And a live endpoint carries auth, uptime, abuse handling, and
an on-call rotation for a problem static files do not have.

The remote path was real code no test reached. fetchRemoteRegistry existed and
nothing exercised it. tests/registry/remote.test.mjs serves the published payload
over HTTP and drives the CLI against it: fetch and validation, a 404, an entry
that fails the schema, and an install that resolves through a configured registry.
Negative-tested by drifting the payload to five items: three tests fail.

Two harness bugs presented as network faults. spawnSync blocks the event loop, and
the HTTP server the CLI was meant to fetch from runs in that same process, so the
server never accepted the connection and the CLI hung until killed; switching to
spawn took the suite from timing out at 30s to passing in 2s. And the 404 handler
called writeHead before a readFileSync that could throw, writing 200 then 404 on
one response.

llms.txt now links the published registry including the pinned immutable version,
so the payload an agent reads is the same URL the CLI fetches.

The generated payload is added to .prettierignore: a Prettier pass on build output
is either a no-op or a diff the next build undoes, which is why
packages/core/registry/ is already ignored.
