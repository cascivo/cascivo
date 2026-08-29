# Input

Text input field with optional label, hint, and error state

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add input
```

Or use it from the prebuilt package without copying:

```tsx
import { Input } from '@cascivo/react'
```

## Category

`inputs`

## Sizes

- `sm`
- `md`
- `lg`

## States

- `idle`
- `focused`
- `error`

## Props

| Prop          | Type                   | Required | Default | Description                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------- | ---------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`       | `string`               | no       | —       | Text label for the control (standalone use). Omit it when wrapping the Input in a Field — the Field owns the label, and setting both double-labels the control. Rendered on screen.                                                                                                                                                                                                                  |
| `hint`        | `string`               | no       | —       | Supplementary hint text shown with the control.                                                                                                                                                                                                                                                                                                                                                      |
| `error`       | `string`               | no       | —       | Error message shown when the value is invalid.                                                                                                                                                                                                                                                                                                                                                       |
| `size`        | `'sm' \| 'md' \| 'lg'` | no       | `md`    | Visual size of the component (e.g. 'sm', 'md', 'lg').                                                                                                                                                                                                                                                                                                                                                |
| `placeholder` | `string`               | no       | —       | Placeholder text shown when the field is empty.                                                                                                                                                                                                                                                                                                                                                      |
| `disabled`    | `boolean`              | no       | `false` | When true, disables the control and removes it from the tab order.                                                                                                                                                                                                                                                                                                                                   |
| `ariaLabel`   | `string`               | no       | —       | Invisible accessible name, for when a visible element outside this component already labels it and `label` would render that text a second time. ⚠ `label` on this component is **visible**; `IconButton.label`/`Sparkline.label` are invisible names, which is the prior that costs adopters a duplicated label. The raw DOM `aria-label` still wins over this. Not rendered — screen readers only. |

## Examples

### With label

```tsx
<Input label="Email" placeholder="you@example.com" />
```

### With error

```tsx
<Input label="Email" error="Invalid email address" />
```

## Client JavaScript

Enhancement only. The component still does its job with JavaScript disabled — the server-rendered HTML is correct and nothing is unreachable; client JS adds polish on top.

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

form, text, input

---

_Generated from registry v1.0.0 on 2026-08-29. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
