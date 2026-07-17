# CodeSnippet

**Category:** display  
**Description:** Displays code (inline, single-line, or multi-line) with an optional copy button, lightweight built-in syntax highlighting for bash/css/js/ts, and an optional terminal-window look

## When to use

- Showing a command, token, or path the user is expected to copy
- Displaying a short read-only code block in docs or UI
- Inline code references inside flowing text (inline variant)

## When NOT to use

- An editable code input — use a textarea or code editor
- Whole source files needing folding, diagnostics, or many languages — use a dedicated viewer; the built-in highlighter is a presentational scan for bash/css/js/ts only

## Anti-patterns

### The inline variant is a single in-text chip; multi-line content belongs in the multi variant

**Bad:** `<CodeSnippet variant="inline" code={"line1\nline2"} />`  
**Good:** `<CodeSnippet variant="multi" code={"line1\nline2"} />`  
**Why:** The inline variant is a single in-text chip; multi-line content belongs in the multi variant

## Related components

- **CopyButton** (pairs-with): CodeSnippet embeds the same clipboard behavior for its copy affordance

## Accessibility rationale

Code is rendered in semantic <code>/<pre>. The copy button is a real button with an aria-label that flips between the copy and copied messages so the action and its result are announced. Line numbers are aria-hidden so they are not read as content.

## Props

| Name              | Type                                 | Required | Default | Description                                                                               |
| ----------------- | ------------------------------------ | -------- | ------- | ----------------------------------------------------------------------------------------- |
| `code`            | `string`                             | Yes      | —       | The code to display (and copy).                                                           |
| `variant`         | `'inline' \| 'single' \| 'multi'`    | No       | single  | inline = a <code> span; single = one-line <pre>; multi = multi-line <pre>.                |
| `language`        | `'bash' \| 'css' \| 'js' \| 'ts'`    | No       | —       | Enables built-in syntax highlighting for the block variants; inline is never highlighted. |
| `terminal`        | `boolean`                            | No       | false   | Renders terminal-window chrome (title bar with dots). Block variants only.                |
| `title`           | `string`                             | No       | —       | Optional label shown in the terminal title bar.                                           |
| `showLineNumbers` | `boolean`                            | No       | —       | Show line numbers (multi only; ignored when language is set).                             |
| `showCopyButton`  | `boolean`                            | No       | —       | Show the copy-to-clipboard button. Defaults true for single/multi, false for inline.      |
| `labels`          | `{ copy?: string; copied?: string }` | No       | —       | Overrides for the component’s user-visible strings (i18n).                                |
| `className`       | `string`                             | No       | —       | Additional CSS class names merged onto the root element.                                  |

## Tokens

- `--cascivo-font-mono`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-surface`
- `--cascivo-radius-control`

## Examples

### Install command

```jsx
<CodeSnippet code="npx cascivo add button" language="bash" />
```

### Inline

```jsx
<p>
  Run <CodeSnippet variant="inline" code="pnpm build" /> first.
</p>
```

### Terminal block

Multi-line shell transcript with terminal-window chrome.

```jsx
<CodeSnippet
  variant="multi"
  language="bash"
  terminal
  title="deploy.sh"
  code={'pnpm build\npnpm deploy'}
/>
```

## Boundaries

| Area        | Level    | Note                                                                 |
| ----------- | -------- | -------------------------------------------------------------------- |
| variant     | strict   | inline \| single \| multi — controls the wrapping element and layout |
| copy button | flexible | Shown by default for single/multi; togglable via showCopyButton      |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo CodeSnippet component (display). Displays code (inline, single-line, or multi-line) with an optional copy button, lightweight built-in syntax highlighting for bash/css/js/ts, and an optional terminal-window look

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

CodeSnippet is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-font-mono, --cascivo-color-text, --cascivo-color-text-muted, --cascivo-color-bg-subtle, --cascivo-color-surface, --cascivo-color-border, --cascivo-radius-surface, --cascivo-radius-control

Accessibility: role "group", WCAG 2.2-AA, keyboard: Enter/Space. Keep it AA.

Do not change (strict): variant — inline | single | multi — controls the wrapping element and layout
Flexible: copy button.

Do not invent props, tokens, or global viewport media queries.
```
