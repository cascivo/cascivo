# CalendarHeatmap

Calendar heatmap — a week-column grid of day cells colored by value (GitHub-style).

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { CalendarHeatmap } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // required — without it the screen-reader data-table fallback renders visibly
```

## Category

`chart`

## Props

| Prop          | Type                     | Required | Default | Description                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------- | ------------------------ | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`        | `CalendarHeatmapDatum[]` | yes      | —       | Days: { day: string \| Date, value }.                                                                                                                                                                                                                                                                                                                                                         |
| `title`       | `string`                 | yes      | —       | Title text for the component.                                                                                                                                                                                                                                                                                                                                                                 |
| `description` | `string`                 | no       | —       | Supporting description text.                                                                                                                                                                                                                                                                                                                                                                  |
| `from`        | `string \| Date`         | no       | —       | Range start (defaults to min day).                                                                                                                                                                                                                                                                                                                                                            |
| `to`          | `string \| Date`         | no       | —       | Range end (defaults to max day).                                                                                                                                                                                                                                                                                                                                                              |
| `width`       | `number`                 | no       | —       | Fixed SVG width in px. ⚠ **Omit for a responsive chart** — the chart fills and tracks its container via a ResizeObserver; there is no correct pixel number in a responsive grid. A fixed width is clamped to the container (max-inline-size: 100%) so it can never overflow its card, but it also stops the chart growing. `useChartSize` is NOT needed for this — charts call it internally. |
| `height`      | `number`                 | no       | `160`   | SVG height in px. Unlike `width`, height does NOT track the container — this is the knob you set to change the chart's aspect.                                                                                                                                                                                                                                                                |
| `tooltip`     | `boolean`                | no       | —       | Whether to show tooltips on hover.                                                                                                                                                                                                                                                                                                                                                            |
| `className`   | `string`                 | no       | —       | Additional CSS class names merged onto the root element.                                                                                                                                                                                                                                                                                                                                      |
| `plain`       | `boolean`                | no       | `false` | When true, renders a minimal variant without chart chrome.                                                                                                                                                                                                                                                                                                                                    |
| `visualMap`   | `VisualMapOptions`       | no       | —       | Map day value → CVD-safe colour (continuous or piecewise) via a keyboard-operable legend that filters the visible range.                                                                                                                                                                                                                                                                      |

## Examples

### Contribution calendar

```tsx
import { CalendarHeatmap } from '@cascivo/charts'
;<CalendarHeatmap
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

_Generated from registry v0.16.0 on 2026-08-05. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
