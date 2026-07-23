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

| Prop            | Type                  | Required | Default | Description                                                        |
| --------------- | --------------------- | -------- | ------- | ------------------------------------------------------------------ |
| `value`         | `string`              | yes      | —       | The controlled value.                                              |
| `onValueChange` | `(v: string) => void` | yes      | —       | Called with the new value when it changes.                         |
| `placeholder`   | `string`              | no       | —       | Placeholder text shown when the field is empty.                    |
| `disabled`      | `boolean`             | no       | `false` | When true, disables the control and removes it from the tab order. |
| `submitOnBlur`  | `boolean`             | no       | `true`  | When true, commits the edit when the field loses focus.            |
| `onCancel`      | `() => void`          | no       | —       | Called when the edit is cancelled.                                 |

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

---

_Generated from registry v0.11.0 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
