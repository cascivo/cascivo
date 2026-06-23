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

| Prop           | Type                                  | Required | Default       | Description                                                 |
| -------------- | ------------------------------------- | -------- | ------------- | ----------------------------------------------------------- |
| `open`         | `boolean`                             | no       | —             | —                                                           |
| `defaultOpen`  | `boolean`                             | no       | —             | —                                                           |
| `onOpenChange` | `(open: boolean) => void`             | no       | —             | —                                                           |
| `snapPoints`   | `number[]`                            | no       | `[0.5, 0.92]` | Detent heights as ascending fractions of the viewport (0–1) |
| `activeSnap`   | `number`                              | no       | —             | —                                                           |
| `defaultSnap`  | `number`                              | no       | `0`           | —                                                           |
| `onSnapChange` | `(index: number) => void`             | no       | —             | —                                                           |
| `title`        | `React.ReactNode`                     | no       | —             | —                                                           |
| `description`  | `React.ReactNode`                     | no       | —             | —                                                           |
| `children`     | `React.ReactNode`                     | no       | —             | —                                                           |
| `labels`       | `{ close?: string; handle?: string }` | no       | —             | —                                                           |
| `className`    | `string`                              | no       | —             | —                                                           |

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
