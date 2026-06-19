# RelativeTime

Displays a date as a localized phrase relative to now, auto-updating

## Install

```bash
npx cascivo add relative-time
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
