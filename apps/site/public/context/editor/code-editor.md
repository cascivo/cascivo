# CodeEditor

**Category:** inputs  
**Description:** Lightweight code editor — a native textarea overlaid on a syntax-highlighted layer, with line numbers and Tab indent.

## When to use

- Editing code or config inline — JSON, snippets, web languages — with line numbers and syntax colors
- A lightweight, themeable code field where a full IDE editor (Monaco/CodeMirror) would be overkill
- Editing Markdown notes — find/replace, real undo/redo, save, and selection-preserving external sync
- Editing long-form Markdown — generated docs, concatenated books, big notes — windowed (viewport-scoped) tokenization keeps scrolling/typing smooth well past ~5,000 lines

## When NOT to use

- You need IntelliSense/LSP, multi-cursor, folding, a minimap, or diff view — use a full editor framework
- Plain prose or a single-line value — use Textarea or Input
- Sustained editing of 100k+-line documents — use a full editor framework / dedicated worker pipeline (the windowed tokenizer keeps per-render work O(viewport), but a worker offload is intentionally out of scope)
- Soft-wrap (wrap) on a very large document — rendering is O(n) under wrap; disable wrap above ~10k lines for sustained editing

## Anti-patterns

### The overlay technique keeps the bundle tiny and themes via the cascivo token system

**Bad:** `Reaching for Monaco to show an editable snippet`  
**Good:** `Use CodeEditor for the basic set (line numbers + highlighting) at a fraction of the weight`  
**Why:** The overlay technique keeps the bundle tiny and themes via the cascivo token system

## Related components

- **Highlight** (pairs-with): The read-only renderer sharing the same tokenizer — for snippets and docs
- **Textarea** (alternative): Use for free-form prose without syntax highlighting

## Accessibility rationale

The native <textarea> is the editing surface, so caret, selection, IME, undo, and the a11y tree come from the browser; the highlight layer and gutter are aria-hidden.

## Props

| Name              | Type                      | Required                           | Default   | Description                                                                                    |
| ----------------- | ------------------------- | ---------------------------------- | --------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `value`           | `string`                  | No                                 | —         | Controlled value                                                                               |
| `defaultValue`    | `string`                  | No                                 | —         | Initial value for uncontrolled use                                                             |
| `onValueChange`   | `(value: string) => void` | No                                 | —         | Called with the new text on every edit                                                         |
| `language`        | `string`                  | No                                 | plaintext | Grammar name (plaintext/json/javascript/typescript/css/html/markdown/bash)                     |
| `lineNumbers`     | `boolean`                 | No                                 | true      | Show the line-number gutter                                                                    |
| `tabSize`         | `number`                  | No                                 | 2         | Spaces per tab stop                                                                            |
| `insertSpaces`    | `boolean`                 | No                                 | true      | Insert spaces vs a literal tab on Tab                                                          |
| `wrap`            | `boolean`                 | No                                 | false     | Soft-wrap long lines instead of scrolling horizontally                                         |
| `readOnly`        | `boolean`                 | No                                 | false     | When true, the value is shown but cannot be edited.                                            |
| `disabled`        | `boolean`                 | No                                 | false     | When true, disables the control and removes it from the tab order.                             |
| `placeholder`     | `string`                  | No                                 | —         | Placeholder text shown when the field is empty.                                                |
| `label`           | `string`                  | No                                 | —         | Accessible label (defaults to the i18n "Code editor")                                          |
| `onSave`          | `(value: string) => void` | No                                 | —         | Called on Mod-S; the browser save dialog is suppressed                                         |
| `bracketMatching` | `boolean`                 | No                                 | false     | Highlight the bracket matching the one adjacent to the caret                                   |
| `theme`           | `EditorTheme`             | No                                 | —         | Per-instance --cascivo-editor-\* overrides; swapping it re-themes live                         |
| `keymap`          | `KeyMap`                  | No                                 | —         | Extra key bindings merged over the built-ins (user wins on a chord)                            |
| `decorations`     | `Decoration[]             | ((value: string) => Decoration[])` | No        | —                                                                                              | Extra offset-range → CSS class decorations |
| `commands`        | `SlashCommand[]`          | No                                 | —         | Slash-command entries; typing "/" opens a filtered menu. Omit to disable.                      |
| `ref`             | `Ref<CodeEditorHandle>`   | No                                 | —         | Imperative handle: applyEdit / getSelection / focus / undo / redo / openFind / openCommandMenu |
| `className`       | `string`                  | No                                 | —         | Additional CSS class names merged onto the root element.                                       |

## Tokens

- `--cascivo-editor-bg`
- `--cascivo-editor-fg`
- `--cascivo-editor-gutter-bg`
- `--cascivo-editor-gutter-fg`
- `--cascivo-editor-gutter-active`
- `--cascivo-editor-current-line`
- `--cascivo-editor-selection`
- `--cascivo-editor-border`
- `--cascivo-editor-match`
- `--cascivo-editor-match-current`
- `--cascivo-editor-bracket`

## Examples

### Basic editor

```jsx
import { CodeEditor } from '@cascivo/editor'
import '@cascivo/editor/styles.css'
;<CodeEditor language="typescript" lineNumbers defaultValue={'const x = 1\n'} />
```

### Controlled

```jsx
<CodeEditor language="json" value={value} onValueChange={setValue} />
```

### Notes editing — find, save, brackets

```jsx
<CodeEditor
  language="markdown"
  value={doc}
  onValueChange={setDoc}
  onSave={save} // Mod-S
  bracketMatching
/> // Mod-F to search
```

### Slash commands

Type "/" to open a filtered command menu; arrows + Enter insert.

```jsx
const commands = [
  { id: 'fence', label: 'Code block', keywords: ['code'], insert: '\u0060\u0060\u0060\n\n\u0060\u0060\u0060' },
  { id: 'todo', label: 'TODO', insert: '// TODO: ' },
  { id: 'date', label: 'Date', run: (e) => e.applyEdit(e.getSelection(), new Date().toISOString()) },
]

<CodeEditor language="markdown" commands={commands} />
```

## Boundaries

| Area            | Level    | Note                                                                                                                                                                                                                                      |
| --------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| languages       | flexible | Ships a small grammar set; registerGrammar adds custom languages without bundle bloat                                                                                                                                                     |
| large documents | flexible | Windowed tokenization (tokenizeRange + LineStateIndex) makes per-render work O(viewport) and per-edit work O(changed suffix); long Markdown edits well past ~5,000 lines. Worker offload / 100k+-line sustained editing stay out of scope |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo CodeEditor component (inputs). Lightweight code editor — a native textarea overlaid on a syntax-highlighted layer, with line numbers and Tab indent.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

CodeEditor is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-editor-bg, --cascivo-editor-fg, --cascivo-editor-gutter-bg, --cascivo-editor-gutter-fg, --cascivo-editor-gutter-active, --cascivo-editor-current-line, --cascivo-editor-selection, --cascivo-editor-border, --cascivo-editor-match, --cascivo-editor-match-current, --cascivo-editor-bracket

Accessibility: role "textbox", WCAG 2.1-AA, keyboard: Tab (indent)/Shift+Tab (dedent)/Mod+Z / Mod+Shift+Z (undo / redo)/Mod+F (find)/Mod+Alt+F (replace)/Mod+S (save)// (open slash-command menu when commands are provided)/Up/Down + Enter/Tab (navigate + insert a command), Escape (dismiss)/Standard textarea editing. Keep it AA.
Flexible: languages, large documents.

Do not invent props, tokens, or global viewport media queries.
```
