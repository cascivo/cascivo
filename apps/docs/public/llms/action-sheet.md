# ActionSheet

Bottom-rising sheet of discrete actions (iOS action-sheet pattern) with a Cancel button

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add action-sheet
```

Or use it from the prebuilt package without copying:

```tsx
import { ActionSheet } from '@cascivo/react'
```

## Category

`overlay`

## States

- `open`
- `closed`

## Props

| Prop           | Type                                  | Required | Default | Description                                                                   |
| -------------- | ------------------------------------- | -------- | ------- | ----------------------------------------------------------------------------- |
| `open`         | `boolean`                             | no       | —       | —                                                                             |
| `defaultOpen`  | `boolean`                             | no       | —       | —                                                                             |
| `onOpenChange` | `(open: boolean) => void`             | no       | —       | —                                                                             |
| `actions`      | `ActionSheetAction[]`                 | yes      | —       | Choices, each with a label, onSelect, and optional destructive/disabled flags |
| `title`        | `React.ReactNode`                     | no       | —       | —                                                                             |
| `description`  | `React.ReactNode`                     | no       | —       | —                                                                             |
| `showCancel`   | `boolean`                             | no       | `true`  | —                                                                             |
| `labels`       | `{ cancel?: string; label?: string }` | no       | —       | —                                                                             |
| `className`    | `string`                              | no       | —       | —                                                                             |

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-color-destructive`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-text-muted`
- `--cascivo-radius-overlay`
- `--cascivo-shadow-overlay`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`
- `--cascivo-z-overlay`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `menu`
- **Keyboard:** ArrowUp, ArrowDown, Home, End, Enter, Space, Escape

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

overlay, action-sheet, menu, mobile, sheet
