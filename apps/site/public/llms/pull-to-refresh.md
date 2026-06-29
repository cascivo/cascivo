# PullToRefresh

Wraps a scrollable region and triggers a refresh when pulled down past a threshold at the top

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add pull-to-refresh
```

Or use it from the prebuilt package without copying:

```tsx
import { PullToRefresh } from '@cascivo/react'
```

## Category

`feedback`

## States

- `idle`
- `pulling`
- `ready`
- `refreshing`

## Props

| Prop        | Type                                                       | Required | Default | Description                                                        |
| ----------- | ---------------------------------------------------------- | -------- | ------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `onRefresh` | `() => Promise<unknown>                                    | unknown` | yes     | —                                                                  | Called when the pull passes the threshold; the spinner shows until it settles |
| `children`  | `React.ReactNode`                                          | yes      | —       | Content rendered inside the component.                             |
| `threshold` | `number`                                                   | no       | `64`    | Pull distance (px) required to trigger a refresh.                  |
| `disabled`  | `boolean`                                                  | no       | —       | When true, disables the control and removes it from the tab order. |
| `labels`    | `{ pull?: string; release?: string; refreshing?: string }` | no       | —       | Overrides for the component’s user-visible strings (i18n).         |
| `className` | `string`                                                   | no       | —       | Additional CSS class names merged onto the root element.           |

## Design tokens

- `--cascivo-color-text-muted`
- `--cascivo-motion-enter`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `status`

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

feedback, pull-to-refresh, mobile, gesture, scroll, refresh
