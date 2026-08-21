# Sheet

Slide-in panel from any edge, using popover=manual and @starting-style animations

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add sheet
```

Or use it from the prebuilt package without copying:

```tsx
import { Sheet } from '@cascivo/react'
```

## Category

`overlay`

## States

- `open`
- `closed`

## Props

| Prop      | Type                                    | Required | Default | Description                                                                                       |
| --------- | --------------------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------- |
| `open`    | `boolean`                               | yes      | —       | Whether the component is open (controlled).                                                       |
| `onClose` | `() => void`                            | yes      | —       | Called when the component is closed.                                                              |
| `title`   | `React.ReactNode`                       | no       | —       | Title text for the component.                                                                     |
| `side`    | `'start' \| 'end' \| 'top' \| 'bottom'` | no       | `end`   | Edge the sheet slides in from: `end` (the inline end — right in LTR), `start`, `top` or `bottom`. |

## Examples

### Basic

```tsx
<Sheet open={isOpen} onClose={() => setIsOpen(false)} title="Filters">
  <FilterForm />
</Sheet>
```

### Bottom sheet

```tsx
<Sheet open={isOpen} onClose={close} side="bottom" title="Share">
  <ShareOptions />
</Sheet>
```

## Client JavaScript

Required. The component's primary job needs client JavaScript, so do not render it from a Server Component without hydrating — even if some or all of its markup appears in the server HTML.

## Design tokens

- `--cascivo-dialog-body-gap`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-lg`
- `--cascivo-shadow-xl`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `dialog`
- **Keyboard:** Escape, Tab, Shift+Tab

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

overlay, drawer, panel, slide

---

_Generated from registry v0.18.0 on 2026-08-17. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
