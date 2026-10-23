# Archived changesets

These 61 changesets recorded work done while building the project, before any
package had been published. They are kept as history, not as release input.

`changeset version` reads `.changeset/*.md` and nothing below it, so moving them
into this directory is what stops them from being applied. Applying all 61 to the
first release would have produced `0.2.0` for packages nobody has installed,
with a changelog that describes a version that never existed. The first release
is `0.1.0`, and `CHANGELOG.md` already carries the history in the form a reader
wants.

New work gets a changeset in `.changeset/` as usual — that is what `changeset add`
writes, and what the `changesets are valid` CI job checks.
