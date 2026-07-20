# Toggletip

A click-triggered info popover for supplementary, selectable content

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add toggletip
```

Or use it from the prebuilt package without copying:

```tsx
import { Toggletip } from '@cascivo/react'
```

## Category

`overlay`

## States

- `open`
- `closed`

## Props

| Prop           | Type                                                                                                   | Required | Default | Description                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------ | -------- | ------- | ------------------------------------------------------------- |
| `trigger`      | `ReactNode`                                                                                            | yes      | —       | Trigger content, rendered inside a button (e.g. an info icon) |
| `children`     | `ReactNode`                                                                                            | yes      | —       | The popover content — interactive and selectable              |
| `placement`    | `'top' \| 'bottom' \| 'left' \| 'right' \| 'top-start' \| 'top-end' \| 'bottom-start' \| 'bottom-end'` | no       | `'top'` | Side and alignment of the bubble relative to the trigger      |
| `defaultOpen`  | `boolean`                                                                                              | no       | `false` | Initial open state when uncontrolled                          |
| `open`         | `boolean`                                                                                              | no       | —       | Controlled open state                                         |
| `onOpenChange` | `(open: boolean) => void`                                                                              | no       | —       | Called whenever the open state should change                  |
| `labels`       | `{ label?: string }`                                                                                   | no       | —       | Override the trigger accessible name                          |

## Examples

### Info toggletip

An info button that reveals supplementary text on click

```tsx
<Toggletip trigger={<InfoIcon />}>Your password must contain at least 12 characters.</Toggletip>
```

### Controlled

Drive the open state from the parent

```tsx
<Toggletip trigger={<InfoIcon />} open={open} onOpenChange={setOpen} placement="bottom-start">
  <a href="/docs">Learn more</a>
</Toggletip>
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-text`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-control`
- `--cascivo-radius-overlay`
- `--cascivo-shadow-md`
- `--cascivo-focus-ring`
- `--cascivo-motion-enter`
- `--cascivo-z-tooltip`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `status`
- **Keyboard:** Enter, Space, Escape

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

overlay, toggletip, info, popover, floating

---

_Generated from registry v0.8.0 on 2026-07-20. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
