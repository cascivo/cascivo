# Highlight

**Category:** display  
**Description:** Read-only syntax-highlighted code block — the same owned tokenizer as CodeEditor, without the textarea.

## When to use

- Displaying non-editable code or config with syntax colors — docs, snippets, examples
- A lightweight highlighter that themes via the cascivo token system

## When NOT to use

- The code must be editable — use CodeEditor
- You need copy-to-clipboard chrome around a snippet — pair with a code-snippet surface

## Related components

- **CodeEditor** (pairs-with): The editable surface sharing the same tokenizer

## Accessibility rationale

Renders a read-only <pre><code>; the line-number gutter is aria-hidden and an optional label names the block.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `string` | Yes | — | Code to render |
| `language` | `string` | No | plaintext | Grammar name (plaintext/json/javascript/typescript/css/html/markdown/bash) |
| `lineNumbers` | `boolean` | No | false | Show the line-number gutter |
| `wrap` | `boolean` | No | false | Soft-wrap long lines |
| `tabSize` | `number` | No | 2 | Spaces per tab stop |
| `label` | `string` | No | — | Accessible label for the code block |
| `className` | `string` | No | — | Additional CSS class names merged onto the root element. |

## Tokens

- `--cascivo-editor-bg`
- `--cascivo-editor-fg`
- `--cascivo-editor-gutter-bg`
- `--cascivo-editor-gutter-fg`
- `--cascivo-editor-border`

## Examples

### Read-only snippet

```jsx
import { Highlight } from '@cascivo/editor'
import '@cascivo/editor/styles.css'

<Highlight language="json" value={'{ "ok": true }'} />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Highlight component (display). Read-only syntax-highlighted code block — the same owned tokenizer as CodeEditor, without the textarea.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Highlight is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-editor-bg, --cascivo-editor-fg, --cascivo-editor-gutter-bg, --cascivo-editor-gutter-fg, --cascivo-editor-border

Accessibility: role "group", WCAG 2.1-AA, keyboard: Scroll (no interactive controls). Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
