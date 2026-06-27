# Calendar

Calendar heatmap — a week-column grid of day cells colored by value (GitHub-style).

## Install

Charts ship in the `@cascivo/charts` package:

```sh
pnpm add @cascivo/charts
```

```tsx
import { Calendar } from '@cascivo/charts'
```

## Category

`chart`

## Props

| Prop          | Type              | Required | Default | Description         |
| ------------- | ----------------- | -------- | ------- | ------------------- | ---------------------------------- |
| `data`        | `CalendarDatum[]` | yes      | —       | Days: { day: string | Date, value }.                     |
| `title`       | `string`          | yes      | —       | —                   |
| `description` | `string`          | no       | —       | —                   |
| `from`        | `string           | Date`    | no      | —                   | Range start (defaults to min day). |
| `to`          | `string           | Date`    | no      | —                   | Range end (defaults to max day).   |
| `width`       | `number`          | no       | —       | —                   |
| `height`      | `number`          | no       | `160`   | —                   |
| `tooltip`     | `boolean`         | no       | —       | —                   |
| `className`   | `string`          | no       | —       | —                   |
| `plain`       | `boolean`         | no       | `false` | —                   |

## Examples

### Contribution calendar

```tsx
import { Calendar } from '@cascivo/charts'
;<Calendar
  title="Activity"
  data={[
    { day: '2026-01-01', value: 3 },
    { day: '2026-01-02', value: 7 },
  ]}
/>
```

## Design tokens

- `--cascivo-chart-2`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `img`
- **Keyboard:** Tab (focus chart), ArrowLeft/ArrowRight (navigate days), Escape (clear focus)

## Dependencies

- `@cascivo/charts`

## Tags

chart, calendar, heatmap, time, data-viz
