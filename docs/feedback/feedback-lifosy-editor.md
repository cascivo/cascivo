# Cascivo Editor — Publish Blocker (gates Phase 4)

**Date:** 2026-06-24
**Status:** 🔴 Blocks the CodeMirror → Cascivo `CodeEditor` migration.

## Problem

`@cascivo/editor@0.1.1` (latest, republished ~8h ago) **ships no build output**.
The published tarball contains only:

```
package/package.json
package/README.md
package/readme.body.md
package/LICENSE
```

But its `package.json` declares:

```json
"files": ["dist"],
"types": "./dist/index.d.ts",
"exports": {
  ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
  "./styles.css": "./dist/editor.css"
}
```

→ `dist/` is missing, so every entry point (`@cascivo/editor`,
`@cascivo/editor/styles.css`) resolves to a non-existent file. The package
cannot be imported.

The **copy-paste path is also empty**: the registry entry for
`editor/code-editor` has `"files": []`, so `npx cascivo add editor/code-editor`
would vendor nothing.

## Root cause

The publish ran without (or before) the build. The package's own
`build` script is:

```
"build": "vp build && node scripts/flatten-types.mjs && node scripts/check-types-flat.mjs"
```

The tarball has no `dist/`, so `vp build` didn't run (or didn't emit) in the
release pipeline.

## Fix (one of)

1. **Run `build` before `npm publish`** in CI (e.g. `prepack`/`prepublishOnly`,
   or a release step that builds then publishes). Verify with
   `npm pack --dry-run` that `dist/index.js`, `dist/index.d.ts`, and
   `dist/editor.css` are listed.
2. Publish a new version (e.g. `0.1.2`) so consumers don't get the cached empty
   `0.1.1` (pnpm/npm may serve the stale same-version artifact).
3. Optionally populate the registry's `editor/code-editor` `files[]` so the
   copy-paste path works too.

## Once fixed — Phase 4 is ready to land

The integration groundwork is already in place:

- Preact bridge (`preact/compat` + `@preact/signals-react → @preact/signals`,
  `useSignals` no-op shim) is wired in the console app build and verified by the
  spike.
- The migration target is `apps/console/src/components/editor/CodeMirrorEditor.tsx`
  (the live editing surface, used by `FileViewer`).
- Validation gate to run against the real `CodeEditor` before swapping:
  markdown highlighting, `Mod-F` find / `Mod-Alt-F` replace, real undo/redo,
  `ref.applyEdit()` + `ref.getSelection()` for selection-preserving external
  sync, `onSave` on `Mod-S`, live `theme` swap (Zen mode), and **large-document
  performance** against real `.md` files.
- On pass: replace CodeMirror behind the existing `Editor`/`CodeMirrorEditor`
  API and drop the seven `@codemirror/*` deps.

The moment `@cascivo/editor` ships its `dist`, the swap + gate can run.
