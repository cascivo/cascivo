# @cascivo/editor

## 0.2.16

### Patch Changes

- 0b6b44e: Force a version bump across every published package to verify the changesets
  publish patch fix (see the release workflow fix in PR #168): several packages
  had been stuck re-publishing their already-released version on every release
  run and failing with a spurious E403, because the "already published" error
  detection missed pnpm's actual error shape. This changeset gives every
  package a real new version so the next release run exercises a genuine
  publish for all of them, not just the ones with substantive changes.
- Updated dependencies [0b6b44e]
  - @cascivo/core@0.5.2
  - @cascivo/i18n@0.2.10

## 0.2.15

### Patch Changes

- 21e7ddb: Raise the `@preact/signals-react` peer floor from `>=2.0.0` to `>=3.0.0`.

  React 19 removed the internal export that signals-react 2.x imports, so a 2.x
  runtime fails to load under React 19 (`SyntaxError: … '__SECRET_INTERNALS…'`). The
  old `>=2` floor let a resolver pick that broken build. signals-react 3.x still
  supports React 16.14+/17/18, so the new floor costs React-18 users nothing.

  If a lockfile carried over from an earlier install pins signals-react 2.x, run
  `cascivo doctor` — it now flags the mismatch (error on React 19, warning on React 18)
  with the exact upgrade command.

- Updated dependencies [21e7ddb]
- Updated dependencies [21e7ddb]
  - @cascivo/core@0.5.0
  - @cascivo/i18n@0.2.9

## 0.2.14

### Patch Changes

- 958fd6f: Every published package now exports `./package.json`, so
  `require.resolve('@cascivo/<pkg>/package.json')` resolves instead of throwing
  `ERR_PACKAGE_PATH_NOT_EXPORTED`. Previously only `@cascivo/react` exposed it, which
  tripped version probes, bundler plugins, and inspection tooling on the other packages.
- Updated dependencies [958fd6f]
- Updated dependencies [958fd6f]
  - @cascivo/core@0.4.1
  - @cascivo/i18n@0.2.8

## 0.2.13

### Patch Changes

- Updated dependencies [357ba46]
  - @cascivo/core@0.4.0
  - @cascivo/i18n@0.2.7

## 0.2.12

### Patch Changes

- 810b8ba: Minor improvements
- Updated dependencies [810b8ba]
  - @cascivo/core@0.3.1
  - @cascivo/i18n@0.2.5

## 0.2.11

### Patch Changes

- 483e30a: Minor improvements
- Updated dependencies [483e30a]
- Updated dependencies [dd05e9b]
  - @cascivo/core@0.3.0
  - @cascivo/i18n@0.2.4

## 0.2.10

### Patch Changes

- e29ad6e: Re-release: publish the packages held back when the previous release run failed its generated-docs gate.
- Updated dependencies [e29ad6e]
  - @cascivo/core@0.2.6
  - @cascivo/i18n@0.2.3

## 0.2.9

### Patch Changes

- b49e0ba: Fixed red flags.
- 6ee2f91: Experience fixes
- Updated dependencies [b49e0ba]
- Updated dependencies [1d7599a]
- Updated dependencies [6ee2f91]
  - @cascivo/core@0.2.5
  - @cascivo/i18n@0.2.2

## 0.2.8

### Patch Changes

- fc61671: Minor improvements
- Updated dependencies [fc61671]
  - @cascivo/core@0.2.4
  - @cascivo/i18n@0.2.1

## 0.2.7

### Patch Changes

- Updated dependencies [5bafdb6]
  - @cascivo/i18n@0.2.0

## 0.2.6

### Patch Changes

- 25ab8b2: Improved editor handling

## 0.2.5

### Patch Changes

- bb3c77e: Templates and further improvements
- Updated dependencies [6b50710]
- Updated dependencies [bb3c77e]
  - @cascivo/i18n@0.1.11
  - @cascivo/core@0.2.3

## 0.2.4

### Patch Changes

- f0b5654: Fixes
- Updated dependencies [f0b5654]
  - @cascivo/core@0.2.2
  - @cascivo/i18n@0.1.10

## 0.2.3

### Patch Changes

- 2458391: Improvements
- 52c08b6: Improvements
- Updated dependencies [2458391]
- Updated dependencies [52c08b6]
  - @cascivo/core@0.2.1
  - @cascivo/i18n@0.1.9

## 0.2.2

### Patch Changes

- Updated dependencies [4554af1]
  - @cascivo/core@0.2.0
  - @cascivo/i18n@0.1.8

## 0.2.1

### Patch Changes

- 75ab15e: Improvements
- 75ab15e: Fix the published tarball shipping no `dist/`: add `@cascivo/editor` to the
  release build filter (`build:release`), add a defensive `prepack` build, and
  verify the tarball contains `dist/index.js`, `dist/index.d.ts`, and
  `dist/editor.css` via a `npm pack --dry-run` assertion. Without the build
  filter entry, `changeset publish` shipped the package unbuilt and unimportable.
  Unblocks the `@lifosy/ui` CodeMirror → Cascivo `CodeEditor` migration (Phase 4).
- Updated dependencies [75ab15e]
  - @cascivo/i18n@0.1.7

## 0.2.0

### Minor Changes

- Large-document performance (v47): windowed (viewport-scoped) tokenization. Per-render
  tokenization is now **O(viewport)** instead of O(document) — `CodeEditor` and `Highlight`
  tokenize only the visible window via a new `tokenizeRange` engine entry fed by a persistent
  per-line `LineStateIndex` (memoized grammar end-states with `ensure` / `startStateOf` /
  `invalidateFrom`). An edit re-tokenizes only the **changed suffix** until the state
  reconverges, not the whole file. The bounded `MAX_CACHE = 5000` per-line memo cap — the
  source of the ~5,000-line cliff — is removed; the index supersedes it for the window.
  Highlighting output is **byte-identical** and the overlay + owned-tokenizer model is
  unchanged, with **zero new dependencies**. Long Markdown now edits well past ~5,000 lines
  (50k-line keystroke ~587 ms → sub-millisecond, flat across document size). `wrap` render
  stays O(n) (documented); a worker offload is evaluated and deferred. New exports:
  `tokenizeRange`, `createLineStateIndex`, `LineStateIndex`.

  Also: the current-line highlight now updates **instantly** when the caret moves
  (driven by `selectionchange`), instead of waiting for `keyup` — fast arrow-key
  navigation no longer leaves the active-row marker lagging behind the cursor.

## 0.1.1

### Patch Changes

- 64535b7: Editor updates
- Updated dependencies [64535b7]
  - @cascivo/i18n@0.1.6

## 0.1.0

### Minor Changes

- Editor parity (v46): close the gap-analysis findings inside the textarea-overlay
  model — owned undo/redo history (`Mod-Z` / `Mod-Shift-Z`) that survives
  programmatic `value` writes; selection-preserving, echo-safe controlled sync;
  in-document find & replace (`Mod-F` / `Mod-Alt-F`); a keymap dispatch with a
  `Mod-S` `onSave` hook and a public `keymap` + `decorations` extension seam;
  per-instance `theme` overrides that switch live; active-line gutter and opt-in
  `bracketMatching`; an imperative `CodeEditorHandle`
  (`applyEdit`/`getSelection`/`focus`/`undo`/`redo`/`openFind`); and a hardened
  Markdown grammar (task lists, strikethrough, horizontal rules, lists, quotes).
  Additive and backward-compatible — the default render is unchanged. New exports:
  `CodeEditorHandle`, `EditorTheme`, `Decoration`, `KeyMap`, `Command`,
  `CommandContext`.

## 0.0.2

### Patch Changes

- aa3c6f3: Introduce Editor
- Updated dependencies [aa3c6f3]
  - @cascivo/i18n@0.1.5

## 0.0.1

### Patch Changes

- Initial release: lightweight CSS-native code editor. `CodeEditor` (native
  textarea overlay) + `Highlight` (read-only renderer) built on an owned,
  zero-dependency per-line tokenizer with tree-shakeable grammars
  (`plaintext`, `json`, `javascript`, `typescript`, `css`, `html`, `markdown`,
  `bash`). Themed through the cascivo token system.
