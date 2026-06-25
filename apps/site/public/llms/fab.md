# Fab

Floating action button anchored to a screen corner, with an optional speed-dial of secondary actions

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add fab
```

Or use it from the prebuilt package without copying:

```tsx
import { Fab } from '@cascivo/react'
```

## Category

`inputs`

## States

- `default`
- `open`
- `closed`

## Props

| Prop           | Type                      | Required        | Default | Description                                                                 |
| -------------- | ------------------------- | --------------- | ------- | --------------------------------------------------------------------------- | --- |
| `children`     | `React.ReactNode`         | yes             | —       | The main icon                                                               |
| `label`        | `string`                  | yes             | —       | Accessible name for the button                                              |
| `onClick`      | `() => void`              | no              | —       | —                                                                           |
| `actions`      | `FabAction[]`             | no              | —       | Speed-dial actions; each has a label, icon, onSelect, and optional disabled |
| `position`     | `'bottom-end'             | 'bottom-start'` | no      | `bottom-end`                                                                | —   |
| `open`         | `boolean`                 | no              | —       | —                                                                           |
| `defaultOpen`  | `boolean`                 | no              | —       | —                                                                           |
| `onOpenChange` | `(open: boolean) => void` | no              | —       | —                                                                           |
| `className`    | `string`                  | no              | —       | —                                                                           |

## Design tokens

- `--cascivo-color-accent`
- `--cascivo-color-accent-content`
- `--cascivo-color-accent-hover`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-full`
- `--cascivo-shadow-overlay`
- `--cascivo-target-min-coarse`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`
- `--cascivo-z-dropdown`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `button`
- **Keyboard:** Enter, Space, ArrowUp, ArrowDown, Home, End, Escape

## Dependencies

- `@cascivo/core`

## Tags

inputs, fab, floating-action-button, mobile, speed-dial
