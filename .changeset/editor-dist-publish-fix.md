---
'@cascivo/editor': patch
---

Fix the published tarball shipping no `dist/`: add `@cascivo/editor` to the
release build filter (`build:release`), add a defensive `prepack` build, and
verify the tarball contains `dist/index.js`, `dist/index.d.ts`, and
`dist/editor.css` via a `npm pack --dry-run` assertion. Without the build
filter entry, `changeset publish` shipped the package unbuilt and unimportable.
Unblocks the `@lifosy/ui` CodeMirror → Cascivo `CodeEditor` migration (Phase 4).
