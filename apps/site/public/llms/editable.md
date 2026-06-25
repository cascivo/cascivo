# Editable

Inline click-to-edit text field

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add editable
```

Or use it from the prebuilt package without copying:

```tsx
import { Editable } from '@cascivo/react'
```

## Category

`inputs`

## States

- `preview`
- `editing`
- `disabled`

## Props

| Prop            | Type                  | Required | Default | Description |
| --------------- | --------------------- | -------- | ------- | ----------- |
| `value`         | `string`              | yes      | —       | —           |
| `onValueChange` | `(v: string) => void` | yes      | —       | —           |
| `placeholder`   | `string`              | no       | —       | —           |
| `disabled`      | `boolean`             | no       | `false` | —           |
| `submitOnBlur`  | `boolean`             | no       | `true`  | —           |
| `onCancel`      | `() => void`          | no       | —       | —           |

## Examples

### Basic

```tsx
<Editable value="Click to edit" onValueChange={() => {}} />
```

### With placeholder

```tsx
<Editable value="" onValueChange={() => {}} placeholder="Enter text" />
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-sm`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `button`
- **Keyboard:** Enter, Escape

## Dependencies

- `@cascivo/core`

## Tags

form, editable, inline, input, text
