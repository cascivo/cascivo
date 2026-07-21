# Calendar

Calendar heatmap — a week-column grid of day cells colored by value (GitHub-style).

> ⚠ **Name collision:** more than one cascivo entry is named `Calendar`.
> This page documents `chart/calendar` (npm @cascivo/charts). Others:
>
> - `calendar` — npm @cascivo/react · or copy-paste — /llms/calendar.md

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { Calendar } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // required — without it the screen-reader data-table fallback renders visibly
```

## Category

`chart`

## Props

| Prop          | Type               | Required | Default | Description                                                                                                              |
| ------------- | ------------------ | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| `data`        | `CalendarDatum[]`  | yes      | —       | Days: { day: string \| Date, value }.                                                                                    |
| `title`       | `string`           | yes      | —       | Title text for the component.                                                                                            |
| `description` | `string`           | no       | —       | Supporting description text.                                                                                             |
| `from`        | `string \| Date`   | no       | —       | Range start (defaults to min day).                                                                                       |
| `to`          | `string \| Date`   | no       | —       | Range end (defaults to max day).                                                                                         |
| `width`       | `number`           | no       | —       | Width of the component.                                                                                                  |
| `height`      | `number`           | no       | `160`   | Height of the component.                                                                                                 |
| `tooltip`     | `boolean`          | no       | —       | Whether to show tooltips on hover.                                                                                       |
| `className`   | `string`           | no       | —       | Additional CSS class names merged onto the root element.                                                                 |
| `plain`       | `boolean`          | no       | `false` | When true, renders a minimal variant without chart chrome.                                                               |
| `visualMap`   | `VisualMapOptions` | no       | —       | Map day value → CVD-safe colour (continuous or piecewise) via a keyboard-operable legend that filters the visible range. |

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

---

_Generated from registry v0.9.0 on 2026-07-21. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
