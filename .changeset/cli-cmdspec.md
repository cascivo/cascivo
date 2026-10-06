---
'cascivo': minor
'@cascivo/docspack': minor
---

The CLI ships a machine-readable description of every command (`dist/cmdspec.json`, in the
[cmdspec](https://docspack.dev/cmdspec) format), named by a new `"cmdspec"` field in its
`package.json`. `docspack sync` indexes it for the installed version, so an agent can ask how to
run a command and learn its flags, effects and exit statuses. `@cascivo/docspack` now carries the
same descriptions as one chunk per command.

`cascivo registry build --help` now documents the `--in` and `--out` flags the command reads (it
listed a `[dir]` argument the command ignores), and `cascivo audit --help` lists `--contract` and
`--verbose`.
