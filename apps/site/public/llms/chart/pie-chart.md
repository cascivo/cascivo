# PieChart

Pie or donut chart with hover segments and optional legend.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { PieChart } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // required — without it the screen-reader data-table fallback renders visibly
```

## Category

`chart`

## Variants

- `pie`
- `donut`

## Props

| Prop            | Type                                                               | Required | Default | Description                                                                                                                               |
| --------------- | ------------------------------------------------------------------ | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `data`          | `PieChartDatum[]`                                                  | yes      | —       | Array of { id, label, value, color? } datums. Optional per-datum `color` (any CSS color) overrides the positional palette for that slice. |
| `title`         | `string`                                                           | yes      | —       | Title text for the component.                                                                                                             |
| `description`   | `string`                                                           | no       | —       | Supporting description text.                                                                                                              |
| `donut`         | `boolean`                                                          | no       | —       | Render as donut chart                                                                                                                     |
| `width`         | `number`                                                           | no       | —       | Width of the component.                                                                                                                   |
| `height`        | `number`                                                           | no       | `300`   | Height of the component.                                                                                                                  |
| `size`          | `number`                                                           | no       | —       | Square shorthand: sets width === height. Explicit width/height win.                                                                       |
| `thickness`     | `number`                                                           | no       | —       | Ring width in px (donut only); defaults to 0.4 × radius.                                                                                  |
| `innerRadius`   | `number`                                                           | no       | —       | Inner radius in px (donut only); takes precedence over thickness; clamped to [0, outerRadius).                                            |
| `centerValue`   | `string`                                                           | no       | —       | Center value text rendered in the donut hole (donut only).                                                                                |
| `centerLabel`   | `string`                                                           | no       | —       | Center label text rendered below the value (donut only).                                                                                  |
| `centerSlot`    | `ReactNode`                                                        | no       | —       | Arbitrary content for the donut hole; takes precedence over centerValue/centerLabel.                                                      |
| `emptyLabel`    | `string`                                                           | no       | —       | Visible placeholder text when data is empty. Defaults to the i18n "No data".                                                              |
| `tooltipFormat` | `(p: ChartPoint) => string`                                        | no       | —       | Custom tooltip formatter. Defaults to "value (pct%)" in the slice color.                                                                  |
| `legend`        | `boolean`                                                          | no       | —       | Whether to show the legend.                                                                                                               |
| `className`     | `string`                                                           | no       | —       | Additional CSS class names merged onto the root element.                                                                                  |
| `plain`         | `boolean`                                                          | no       | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts.                                                                     |
| `labels`        | `boolean \| { format?: (v: number) => string; position?: string }` | no       | —       | Print each value as a label on the mark (collision-aware, decorative/aria-hidden).                                                        |
| `onSelect`      | `(point: ChartPoint) => void`                                      | no       | —       | Fired when a point is clicked or activated (Enter/Space) — for drill-down.                                                                |

## Object types

### `PieChartDatum`

One slice. Pass via the `data` prop.

| Field   | Type     | Required | Description                                                                         |
| ------- | -------- | -------- | ----------------------------------------------------------------------------------- |
| `id`    | `string` | no       | Stable identity (used for legend toggle state).                                     |
| `label` | `string` | yes      | —                                                                                   |
| `value` | `number` | yes      | —                                                                                   |
| `color` | `string` | no       | Any CSS color overriding the positional palette (--cascivo-chart-N) for this slice. |

### `ChartPoint`

Argument passed to the `tooltipFormat` callback.

| Field     | Type               | Required | Description                                                              |
| --------- | ------------------ | -------- | ------------------------------------------------------------------------ |
| `label`   | `string`           | yes      | Slice label.                                                             |
| `value`   | `number \| string` | yes      | —                                                                        |
| `percent` | `number`           | no       | Share of the whole, 0–100. Used by the default "value (pct%)" formatter. |
| `color`   | `string`           | no       | Resolved slice color (the default tooltip tints its text with this).     |

## Examples

### Basic pie chart

```tsx
import { PieChart } from '@cascivo/charts'
;<PieChart
  data={[
    { label: 'A', value: 60 },
    { label: 'B', value: 40 },
  ]}
  title="Market share"
/>
```

### Donut with center total and custom thickness

```tsx
import { PieChart } from '@cascivo/charts'
;<PieChart
  donut
  size={220}
  thickness={28}
  centerValue="142"
  centerLabel="Total tasks"
  data={[
    { id: 'done', label: 'Done', value: 92, color: 'var(--cascivo-color-success)' },
    { id: 'wip', label: 'In progress', value: 34, color: 'var(--cascivo-color-warning)' },
    { id: 'blocked', label: 'Blocked', value: 16, color: 'var(--cascivo-color-destructive)' },
  ]}
  title="Task status"
/>
```

### Percentage tooltip + empty state

```tsx
import { PieChart } from '@cascivo/charts'

// Default tooltip shows "value (pct%)" in the slice color; pass tooltipFormat to override.
<PieChart data={[{id:'a',label:'A',value:60},{id:'b',label:'B',value:40}]} title="Share" />

// Empty data renders a visible "No data" placeholder (override via emptyLabel).
<PieChart data={[]} title="Share" emptyLabel="Nothing tracked yet" />
```

## Design tokens

- `--cascivo-chart-1`
- `--cascivo-chart-2`
- `--cascivo-chart-3`
- `--cascivo-chart-4`
- `--cascivo-chart-5`
- `--cascivo-chart-6`
- `--cascivo-chart-7`
- `--cascivo-chart-8`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `img`

## Dependencies

- `@cascivo/charts`

## Tags

chart, pie, donut, data-viz

---

_Generated from registry v0.11.0 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
