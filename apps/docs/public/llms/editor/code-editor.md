# CodeEditor

Lightweight code editor — a native textarea overlaid on a syntax-highlighted layer, with line numbers and Tab indent.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add editor/code-editor
```

_Copy-paste only — this block/layout is not published as an importable package._

## Category

`inputs`

## States

- `default`

## Props

| Prop            | Type                      | Required | Default     | Description                                                                |
| --------------- | ------------------------- | -------- | ----------- | -------------------------------------------------------------------------- |
| `value`         | `string`                  | no       | —           | Controlled value                                                           |
| `defaultValue`  | `string`                  | no       | —           | Initial value for uncontrolled use                                         |
| `onValueChange` | `(value: string) => void` | no       | —           | Called with the new text on every edit                                     |
| `language`      | `string`                  | no       | `plaintext` | Grammar name (plaintext/json/javascript/typescript/css/html/markdown/bash) |
| `lineNumbers`   | `boolean`                 | no       | `true`      | Show the line-number gutter                                                |
| `tabSize`       | `number`                  | no       | `2`         | Spaces per tab stop                                                        |
| `insertSpaces`  | `boolean`                 | no       | `true`      | Insert spaces vs a literal tab on Tab                                      |
| `wrap`          | `boolean`                 | no       | `false`     | Soft-wrap long lines instead of scrolling horizontally                     |
| `readOnly`      | `boolean`                 | no       | `false`     | —                                                                          |
| `disabled`      | `boolean`                 | no       | `false`     | —                                                                          |
| `placeholder`   | `string`                  | no       | —           | —                                                                          |
| `label`         | `string`                  | no       | —           | Accessible label (defaults to the i18n "Code editor")                      |
| `className`     | `string`                  | no       | —           | —                                                                          |

## Examples

### Basic editor

```tsx
import { CodeEditor } from '@cascivo/editor'
import '@cascivo/editor/styles.css'
;<CodeEditor language="typescript" lineNumbers defaultValue={'const x = 1\n'} />
```

### Controlled

```tsx
<CodeEditor language="json" value={value} onValueChange={setValue} />
```

## Design tokens

- `--cascivo-editor-bg`
- `--cascivo-editor-fg`
- `--cascivo-editor-gutter-bg`
- `--cascivo-editor-gutter-fg`
- `--cascivo-editor-current-line`
- `--cascivo-editor-selection`
- `--cascivo-editor-border`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `textbox`
- **Keyboard:** Tab (indent), Shift+Tab (dedent), Standard textarea editing

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

editor, code, syntax-highlighting, textarea, inputs
