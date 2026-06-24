A lightweight, CSS-native, signal-driven code editor for cascivo. `CodeEditor` overlays a native `<textarea>` on a syntax-highlighted `<pre>`, so the browser owns the caret, selection, IME, and accessibility — JS adds an owned tokenizer, scroll-sync, and a thin layer of editing affordances. `Highlight` is the read-only renderer for snippets and docs. Zero runtime dependencies, themeable through the cascivo token system.

Beyond highlighting it provides the essentials for editing real documents: **owned undo/redo** (`Mod-Z` / `Mod-Shift-Z`) that survives programmatic `value` changes, **selection-preserving, echo-safe controlled sync** (external/remote updates don't jump the caret), **find & replace** (`Mod-F`), a **`Mod-S` save** hook, **per-instance theming** that can switch live, **bracket matching**, an **active-line gutter**, and an imperative **`CodeEditorHandle`**.

It is deliberately not a full editor engine: no LSP/IntelliSense, multi-cursor, code folding, minimap, or vim mode — reach for a full framework (Monaco/CodeMirror) if you need those.

## Install

```sh
pnpm add @cascivo/editor @preact/signals-react
```

`react`, `react-dom`, and `@preact/signals-react` are peer dependencies — install them in your app.

## Usage

```tsx
import { CodeEditor } from '@cascivo/editor'
import '@cascivo/editor/styles.css' // required — maps to the dist `editor.css`
import '@cascivo/themes/dark.css' // any cascivo theme drives the editor colors

export function Example() {
  return <CodeEditor language="typescript" lineNumbers defaultValue={`const x = 1\n`} />
}
```

The editor is CSS-token-themed: drop it inside any element carrying a `data-theme` (or import a
theme stylesheet) and it picks up the same palette, radii, and typography as the rest of cascivo —
including the syntax colors, which map onto the `--cascivo-editor-syntax-*` palette.

### Read-only highlighting

```tsx
import { Highlight } from '@cascivo/editor'
;<Highlight language="json" value={`{ "ok": true }`} />
```

### Languages

Ships small, tree-shakeable grammars: `plaintext`, `json`, `javascript`, `typescript`, `css`,
`html`, `markdown`, `bash`. Register your own with `registerGrammar(grammar)`.

### Large documents

The editor edits long Markdown documents — generated docs, concatenated books, big notes —
well past the old ~5,000-line ceiling. On every render it tokenizes only the **visible window**
(O(viewport)) rather than the whole document, and an edit re-tokenizes only the **changed
suffix** until the grammar state reconverges. This is the same overlay + owned-tokenizer model,
with **zero new dependencies** and **byte-identical highlighting output** — just a persistent
per-line state index (`LineStateIndex`) feeding a viewport-scoped `tokenizeRange`. Scrolling and
typing stay smooth well past 50,000 lines.

One trade-off: with `wrap` (soft-wrap) on, row heights are variable so DOM windowing is disabled
and every row renders (O(n) render). Edits stay cheap, but for sustained editing of very large
documents (≳10,000 lines) disable `wrap`. See [`PERFORMANCE.md`](./PERFORMANCE.md) for the
measured before/after numbers and the deferred worker-offload boundary.

### Extending the editor

Three bounded seams — no plugin lifecycle, no transaction filters (use a full editor
framework if you need those):

- **Key bindings** — pass a `keymap` of `chord → command`. Chords use `Mod` for
  Cmd/Ctrl (e.g. `'Mod-s'`, `'Mod-Shift-z'`, `'Shift-Tab'`); a command returns `true`
  when it handled the event. User bindings merge over (and override) the built-ins.
- **Decorations** — pass `decorations` (an array, or `(value) => Decoration[]`) to tag
  `{ line, start, end, className }` column ranges; they render as extra classes in the
  highlight layer (the same seam find and bracket-matching use).
- **Grammars** — register a language with `registerGrammar(grammar)`.

```tsx
<CodeEditor
  language="markdown"
  onSave={(value) => save(value)} // Mod-S
  keymap={{
    'Mod-/': ({ textarea, setText }) => {
      /* toggle comment */ return true
    },
  }}
  decorations={(value) => findTodos(value)}
/>
```

### React apps must subscribe to signals

`CodeEditor` and `Highlight` are signal-driven. In a plain React app (no Babel signals transform),
they already call `useSignals()` internally — no extra wiring is required.
