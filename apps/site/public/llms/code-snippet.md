# CodeSnippet

Displays code (inline, single-line, or multi-line) with an optional copy button, lightweight built-in syntax highlighting for bash/css/js/ts, and an optional terminal-window look

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add code-snippet
```

Or use it from the prebuilt package without copying:

```tsx
import { CodeSnippet } from '@cascivo/react'
```

## Category

`display`

## Variants

- `inline`
- `single`
- `multi`

## States

- `idle`
- `copied`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `code` | `string` | yes | — | The code to display (and copy). |
| `variant` | `'inline' \| 'single' \| 'multi'` | no | `single` | inline = a <code> span; single = one-line <pre>; multi = multi-line <pre>. |
| `language` | `'bash' \| 'css' \| 'js' \| 'ts'` | no | — | Enables built-in syntax highlighting for the block variants; inline is never highlighted. |
| `terminal` | `boolean` | no | `false` | Renders terminal-window chrome (title bar with dots). Block variants only. |
| `title` | `string` | no | — | Optional label shown in the terminal title bar. |
| `showLineNumbers` | `boolean` | no | — | Show line numbers (multi only; ignored when language is set). |
| `showCopyButton` | `boolean` | no | — | Show the copy-to-clipboard button. Defaults true for single/multi, false for inline. |
| `labels` | `{ copy?: string; copied?: string }` | no | — | Overrides for the component’s user-visible strings (i18n). |
| `className` | `string` | no | — | Additional CSS class names merged onto the root element. |

## Examples

### Install command

```tsx
<CodeSnippet code="npx cascivo add button" language="bash" />
```

### Inline

```tsx
<p>Run <CodeSnippet variant="inline" code="pnpm build" /> first.</p>
```

### Terminal block

Multi-line shell transcript with terminal-window chrome.

```tsx
<CodeSnippet
  variant="multi"
  language="bash"
  terminal
  title="deploy.sh"
  code={'pnpm build\npnpm deploy'}
/>
```

## Design tokens

- `--cascivo-font-mono`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-surface`
- `--cascivo-radius-control`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `group`
- **Keyboard:** Enter, Space

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

display, code, snippet, copy, pre, syntax-highlighting, terminal, bash, css, js, ts
