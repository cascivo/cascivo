# Highlight

Read-only syntax-highlighted code block — the same owned tokenizer as CodeEditor, without the textarea.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add editor/highlight
```

_Copy-paste only — this block/layout is not published as an importable package._

## Category

`display`

## Props

| Prop          | Type      | Required | Default     | Description                                                                |
| ------------- | --------- | -------- | ----------- | -------------------------------------------------------------------------- |
| `value`       | `string`  | yes      | —           | Code to render                                                             |
| `language`    | `string`  | no       | `plaintext` | Grammar name (plaintext/json/javascript/typescript/css/html/markdown/bash) |
| `lineNumbers` | `boolean` | no       | `false`     | Show the line-number gutter                                                |
| `wrap`        | `boolean` | no       | `false`     | Soft-wrap long lines                                                       |
| `tabSize`     | `number`  | no       | `2`         | Spaces per tab stop                                                        |
| `label`       | `string`  | no       | —           | Accessible label for the code block                                        |
| `className`   | `string`  | no       | —           | Additional CSS class names merged onto the root element.                   |

## Examples

### Read-only snippet

```tsx
import { Highlight } from '@cascivo/editor'
import '@cascivo/editor/styles.css'
;<Highlight language="json" value={'{ "ok": true }'} />
```

## Design tokens

- `--cascivo-editor-bg`
- `--cascivo-editor-fg`
- `--cascivo-editor-gutter-bg`
- `--cascivo-editor-gutter-fg`
- `--cascivo-editor-border`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `group`
- **Keyboard:** Scroll (no interactive controls)

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

editor, code, syntax-highlighting, display, read-only
