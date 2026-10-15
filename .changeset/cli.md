---
"@santaka-ui/cli": minor
"@santaka-ui/web-components": minor
---

init, add, list, doctor, diff, theme init, registry, and update. 37 unit tests
cover detection, path safety, the manifest, the diff, and rollback; 18
end-to-end tests drive the built binary in a real subprocess against a real
temporary project, because an exit code is only observable from a process. A CI
job runs both on Linux, macOS, and Windows, per section 8.

Three rules shape it, and each is a place a CLI destroys someone's work if it
gets the answer wrong.

A run either completes or leaves nothing behind. Writes go through a journal:
every destination is backed up before it is replaced, and a failure replays the
journal backwards. A per-file try/catch would leave the earlier files of the
same run in place, which is the half-installed state the rule exists to prevent,
because the consumer cannot tell which half they have. The e2e suite proves it
by making a later write fail and asserting the earlier file was restored.

A modified file is never overwritten without consent. A conflict prints a
unified diff, exits 2, and writes nothing; --overwrite and --skip resolve it.
Exit 2 rather than 1 is load-bearing: section 8 makes `santaka diff` a CI check
and a script needs to tell "drifted" from "crashed".

The registry is untrusted, and validation is not review. A destination is
confirmed inside the project root with a relative() check rather than a string
prefix — a prefix test accepts /project-evil for /project. Source bytes are
hashed against the entry's declared checksum. `registry add` says plainly that
schema validation makes an entry well-formed, not trustworthy.

Two findings worth recording, because both were wrong first and both are
invisible to a passing test.

--skip must not rewrite the manifest. The manifest records the hash of the bytes
the CLI wrote, not the bytes on disk. When a run skips a file the manifest has
to keep that hash, or the drift disappears from the record the moment the
consumer chooses to keep it, and the next `diff` reports clean on a file that is
not what the registry shipped.

Source mode needed the source published. The registry's file paths are
src/components/<tag>/<tag>.{tsx,css}, but @santaka-ui/web-components shipped only
dist/. Source mode would have passed every test in this monorepo and failed for
every consumer — the exact defect ADR-012's distribution contract exists to
catch. The package now publishes src/components/, and the CLI resolves it
through require.resolve so the workspace and the tarball take the same path.

The CLI deliberately does not install dependencies: section 8 requires it to
document CSS and build requirements, and a scaffolder that shells out to a
package manager can no longer tell a network failure from a permissions failure
from a version conflict. It prints the command instead.
