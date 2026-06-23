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

| Prop        | Type                                                       | Required | Default | Description |
| ----------- | ---------------------------------------------------------- | -------- | ------- | ----------- | ----------------------------------------------------------------------------- |
| `onRefresh` | `() => Promise<unknown>                                    | unknown` | yes     | —           | Called when the pull passes the threshold; the spinner shows until it settles |
| `children`  | `React.ReactNode`                                          | yes      | —       | —           |
| `threshold` | `number`                                                   | no       | `64`    | —           |
| `disabled`  | `boolean`                                                  | no       | —       | —           |
| `labels`    | `{ pull?: string; release?: string; refreshing?: string }` | no       | —       | —           |
| `className` | `string`                                                   | no       | —       | —           |

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
