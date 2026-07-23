# Popover

Anchored floating panel built on CSS Anchor Positioning + Popover API

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add popover
```

Or use it from the prebuilt package without copying:

```tsx
import { Popover } from '@cascivo/react'
```

## Category

`overlay`

## States

- `open`
- `closed`

## Props

| Prop           | Type                                     | Required | Default  | Description                                      |
| -------------- | ---------------------------------------- | -------- | -------- | ------------------------------------------------ |
| `children`     | `React.ReactNode`                        | yes      | —        | A PopoverTrigger and PopoverContent pair.        |
| `open`         | `boolean`                                | no       | —        | Whether the component is open (controlled).      |
| `onOpenChange` | `(open: boolean) => void`                | no       | —        | Called with the next open state when it changes. |
| `placement`    | `'top' \| 'bottom' \| 'left' \| 'right'` | no       | `bottom` | Placement relative to the trigger.               |
| `offset`       | `number`                                 | no       | `4`      | Distance (px) between the trigger and the panel. |

## Examples

### Basic

```tsx
<Popover>
  <PopoverTrigger>Open settings</PopoverTrigger>
  <PopoverContent>
    <form>…</form>
  </PopoverContent>
</Popover>
```

### Controlled with placement

```tsx
<Popover open={isOpen} onOpenChange={setIsOpen} placement="top">
  <PopoverTrigger>Filters</PopoverTrigger>
  <PopoverContent>
    <FilterForm />
  </PopoverContent>
</Popover>
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-md`
- `--cascivo-shadow-md`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `dialog`
- **Keyboard:** Escape

## Dependencies

- `@cascivo/core`

## Tags

overlay, floating, anchor, popover

---

_Generated from registry v0.11.0 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
