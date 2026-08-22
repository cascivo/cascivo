# Checkbox

Binary toggle for forms, with indeterminate support

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add checkbox
```

Or use it from the prebuilt package without copying:

```tsx
import { Checkbox } from '@cascivo/react'
```

## Category

`inputs`

## States

- `unchecked`
- `checked`
- `indeterminate`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | `string` | no | — | Text label for the control. Rendered on screen. |
| `checked` | `boolean` | no | — | Whether the control is checked (controlled). |
| `indeterminate` | `boolean` | no | `false` | When true, renders the mixed/indeterminate state. |
| `disabled` | `boolean` | no | `false` | When true, disables the control and removes it from the tab order. |
| `onChange` | `React.ChangeEventHandler<HTMLInputElement>` | no | — | Called when the value changes. |
| `ariaLabel` | `string` | no | — | Invisible accessible name, for when a visible element outside this component already labels it and `label` would render that text a second time. ⚠ `label` on this component is **visible**; `IconButton.label`/`Sparkline.label` are invisible names, which is the prior that costs adopters a duplicated label. The raw DOM `aria-label` still wins over this. Not rendered — screen readers only. |

## Examples

### With label

```tsx
<Checkbox label="Accept terms" />
```

### Indeterminate

```tsx
<Checkbox label="Select all" indeterminate />
```

## Client JavaScript

Enhancement only. The component still does its job with JavaScript disabled — the server-rendered HTML is correct and nothing is unreachable; client JS adds polish on top.

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-accent`
- `--cascivo-color-border-strong`
- `--cascivo-color-text-on-accent`
- `--cascivo-radius-sm`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `checkbox`
- **Keyboard:** Space

## Dependencies

- `@cascivo/core`

## Tags

form, toggle, boolean

---

_Generated from registry v0.18.0 on 2026-08-17. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
