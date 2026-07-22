# Textarea

Multi-line text input with optional label, hint, and error state

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add textarea
```

Or use it from the prebuilt package without copying:

```tsx
import { Textarea } from '@cascivo/react'
```

## Category

`inputs`

## States

- `idle`
- `focused`
- `error`

## Props

| Prop       | Type                             | Required | Default    | Description                                                                    |
| ---------- | -------------------------------- | -------- | ---------- | ------------------------------------------------------------------------------ |
| `label`    | `string`                         | no       | —          | Text label for the control.                                                    |
| `hint`     | `string`                         | no       | —          | Supplementary hint text shown with the control.                                |
| `error`    | `string`                         | no       | —          | Error message shown when the value is invalid.                                 |
| `rows`     | `number`                         | no       | `4`        | Number of visible text rows.                                                   |
| `resize`   | `'none' \| 'vertical' \| 'both'` | no       | `vertical` | Which directions the textarea can be resized ('none' \| 'vertical' \| 'both'). |
| `disabled` | `boolean`                        | no       | `false`    | When true, disables the control and removes it from the tab order.             |

## Examples

### With label

```tsx
<Textarea label="Message" placeholder="Type here…" />
```

### With error

```tsx
<Textarea label="Bio" error="Bio is required" />
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-color-destructive`
- `--cascivo-radius-input`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `textbox`
- **Keyboard:** Tab, Shift+Tab

## Dependencies

- `@cascivo/core`

## Tags

form, text, multiline

---

_Generated from registry v0.9.0 on 2026-07-22. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
