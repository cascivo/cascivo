# RelativeTime

**Category:** display  
**Description:** Displays a date as a localized phrase relative to now, auto-updating

## When to use

- Showing how long ago something happened in human terms ("3 minutes ago")
- Timestamps in feeds, comments, and activity logs where recency matters more than precision
- Anywhere a self-updating relative time is friendlier than an absolute date

## When NOT to use

- Precise timestamps in tables or audit logs — use formatDate for an exact, sortable value
- Dates far in the past/future where "2 years ago" is less useful than the actual date

## Anti-patterns

### Relative phrases lose precision; the exact date belongs in records (RelativeTime still exposes it via title/datetime)

**Bad:** `<RelativeTime date={date} /> as the only representation of a legal/audit timestamp`  
**Good:** `<time>{formatDate(date)}</time> for exact records; RelativeTime for casual recency`  
**Why:** Relative phrases lose precision; the exact date belongs in records (RelativeTime still exposes it via title/datetime)

## Related components

- **Stat** (pairs-with): Use alongside Stat to timestamp a metric’s last update

## Accessibility rationale

Renders a native <time> element with a machine-readable datetime and the absolute date in the title, so the precise instant is available even though the visible text is relative

## Props

| Name     | Type                             | Required | Default | Description                                |
| -------- | -------------------------------- | -------- | ------- | ------------------------------------------ | --- | --- |
| `date`   | `Date                            | number   | string` | Yes                                        | —   | —   |
| `sync`   | `boolean`                        | No       | true    | —                                          |
| `now`    | `number`                         | No       | —       | Override "now" (ms); disables the interval |
| `format` | `Intl.RelativeTimeFormatOptions` | No       | —       | —                                          |

## Examples

### Basic

```jsx
<RelativeTime date={post.createdAt} />
```

### Natural language

```jsx
<RelativeTime date={date} format={{ numeric: 'auto' }} />
```

### Static (no ticking)

```jsx
<RelativeTime date={date} sync={false} />
```

## Boundaries

| Area   | Level    | Note                                                                            |
| ------ | -------- | ------------------------------------------------------------------------------- |
| format | flexible | Pass Intl.RelativeTimeFormat options (e.g. numeric: "auto") to tune the wording |
| sync   | flexible | Disable ticking for static contexts or long-past dates                          |
