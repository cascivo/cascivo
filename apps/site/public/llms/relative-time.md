# RelativeTime

Displays a date as a localized phrase relative to now, auto-updating

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add relative-time
```

Or use it from the prebuilt package without copying:

```tsx
import { RelativeTime } from '@cascivo/react'
```

## Category

`display`

## States

- `default`

## Props

| Prop     | Type                             | Required | Default | Description                                |
| -------- | -------------------------------- | -------- | ------- | ------------------------------------------ | --- | --- |
| `date`   | `Date                            | number   | string` | yes                                        | —   | —   |
| `sync`   | `boolean`                        | no       | `true`  | —                                          |
| `now`    | `number`                         | no       | —       | Override "now" (ms); disables the interval |
| `format` | `Intl.RelativeTimeFormatOptions` | no       | —       | —                                          |

## Examples

### Basic

```tsx
<RelativeTime date={post.createdAt} />
```

### Natural language

```tsx
<RelativeTime date={date} format={{ numeric: 'auto' }} />
```

### Static (no ticking)

```tsx
<RelativeTime date={date} sync={false} />
```

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `time`

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

time, date, relative, i18n, display
