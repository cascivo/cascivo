# Collapsible

A single disclosure region toggled open and closed by its trigger

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add collapsible
```

Or use it from the prebuilt package without copying:

```tsx
import { Collapsible } from '@cascivo/react'
```

## Category

`display`

## States

- `open`
- `closed`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `open` | `boolean` | no | — | Controlled open state |
| `defaultOpen` | `boolean` | no | `false` | Initial open state for uncontrolled use |
| `onOpenChange` | `(open: boolean) => void` | no | — | Called whenever the open state should change |
| `trigger` | `ReactNode` | yes | — | Content rendered inside the built-in trigger button |
| `disabled` | `boolean` | no | `false` | Disables the trigger. Enforced in the enhancement layer — <details> has no native disabled state, so with JavaScript off a disabled Collapsible is still operable |
| `children` | `ReactNode` | no | — | Content of the collapsible region |

## Examples

### Uncontrolled

```tsx
<Collapsible trigger="Show details">
  <p>Hidden content revealed on toggle.</p>
</Collapsible>
```

### Open by default

```tsx
<Collapsible defaultOpen trigger="Details">
  <p>Visible initially.</p>
</Collapsible>
```

## Client JavaScript

Enhancement only. The server-rendered HTML is correct and no content is unreachable with JavaScript disabled; client JS adds interaction on top.

## Design tokens

- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-border`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-control`
- `--cascivo-focus-ring`
- `--cascivo-space-3`
- `--cascivo-duration-200`
- `--cascivo-ease-out`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `button`
- **Keyboard:** Enter, Space

## Dependencies

- `@cascivo/core`

## Tags

disclosure, collapse, expand, toggle, show-hide

---

_Generated from registry v0.16.0 on 2026-08-05. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
