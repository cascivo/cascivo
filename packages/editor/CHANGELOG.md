# @cascivo/editor

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
