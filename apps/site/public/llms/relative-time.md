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

| Prop     | Type                             | Required | Default | Description                                                                                                               |
| -------- | -------------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| `date`   | `Date \| number \| string`       | yes      | —       | The date to render relative to now.                                                                                       |
| `sync`   | `boolean`                        | no       | `true`  | When true, updates the relative time as it elapses.                                                                       |
| `now`    | `number`                         | no       | —       | Override "now" (ms); disables the interval. Pass a serialized server timestamp under SSR for a byte-deterministic render. |
| `format` | `Intl.RelativeTimeFormatOptions` | no       | —       | Intl.RelativeTimeFormat options controlling the output.                                                                   |

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

### SSR deterministic

Relative text is clock-dependent, so it is hydration-safe by default (the server text is kept and corrected on the client). Pass a serialized server timestamp via `now` when you need identical server/client output with no post-hydration correction.

```tsx
<RelativeTime date={date} now={serverNow} />
```

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `time`

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

time, date, relative, i18n, display

---

_Generated from registry v0.8.0 on 2026-07-20. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
