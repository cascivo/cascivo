A lightweight, CSS-native, signal-driven code editor for cascivo. `CodeEditor` overlays a native `<textarea>` on a syntax-highlighted `<pre>`, so the browser owns the caret, selection, IME, undo, and accessibility — JS is limited to a tiny owned tokenizer and scroll-sync. `Highlight` is the read-only renderer for snippets and docs. Zero runtime dependencies, themeable through the cascivo token system.

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

### React apps must subscribe to signals

`CodeEditor` and `Highlight` are signal-driven. In a plain React app (no Babel signals transform),
they already call `useSignals()` internally — no extra wiring is required.
