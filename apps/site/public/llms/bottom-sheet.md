# BottomSheet

Mobile bottom sheet with drag-to-resize detents, velocity-projected snapping, and drag-to-dismiss

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add bottom-sheet
```

Or use it from the prebuilt package without copying:

```tsx
import { BottomSheet } from '@cascivo/react'
```

## Category

`overlay`

## States

- `open`
- `closed`
- `dragging`

## Props

| Prop           | Type                                  | Required | Default       | Description                                                   |
| -------------- | ------------------------------------- | -------- | ------------- | ------------------------------------------------------------- |
| `open`         | `boolean`                             | no       | —             | Whether the component is open (controlled).                   |
| `defaultOpen`  | `boolean`                             | no       | —             | Whether the component is open on first render (uncontrolled). |
| `onOpenChange` | `(open: boolean) => void`             | no       | —             | Called with the next open state when it changes.              |
| `snapPoints`   | `number[]`                            | no       | `[0.5, 0.92]` | Detent heights as ascending fractions of the viewport (0–1)   |
| `activeSnap`   | `number`                              | no       | —             | The controlled snap-point index.                              |
| `defaultSnap`  | `number`                              | no       | `0`           | The initial snap-point index when uncontrolled.               |
| `onSnapChange` | `(index: number) => void`             | no       | —             | Called with the new snap-point index when it changes.         |
| `title`        | `React.ReactNode`                     | no       | —             | Title text for the component.                                 |
| `description`  | `React.ReactNode`                     | no       | —             | Supporting description text.                                  |
| `children`     | `React.ReactNode`                     | no       | —             | Content rendered inside the component.                        |
| `labels`       | `{ close?: string; handle?: string }` | no       | —             | Overrides for the component’s user-visible strings (i18n).    |
| `className`    | `string`                              | no       | —             | Additional CSS class names merged onto the root element.      |

## Examples

### Basic

```tsx
<BottomSheet open={isOpen} onOpenChange={setIsOpen} title="Filters">
  <FilterForm />
</BottomSheet>
```

### Custom detents

Snaps between three detents by dragging the handle; opens at half height.

```tsx
<BottomSheet defaultOpen snapPoints={[0.25, 0.5, 0.9]} defaultSnap={1} title="Nearby">
  <PlacesList />
</BottomSheet>
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-overlay`
- `--cascivo-shadow-overlay`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`
- `--cascivo-target-min-coarse`
- `--cascivo-z-overlay`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `dialog`
- **Keyboard:** Escape, Tab, Shift+Tab

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

overlay, sheet, bottom-sheet, mobile, drag, detent, gesture

---

_Generated from registry v0.11.0 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
