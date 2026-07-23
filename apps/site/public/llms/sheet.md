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

| Prop      | Type                                    | Required | Default | Description                                 |
| --------- | --------------------------------------- | -------- | ------- | ------------------------------------------- |
| `open`    | `boolean`                               | yes      | —       | Whether the component is open (controlled). |
| `onClose` | `() => void`                            | yes      | —       | Called when the component is closed.        |
| `title`   | `React.ReactNode`                       | no       | —       | Title text for the component.               |
| `side`    | `'start' \| 'end' \| 'top' \| 'bottom'` | no       | `end`   | Edge the component is anchored to.          |

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

## Design tokens

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

_Generated from registry v0.10.1 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
