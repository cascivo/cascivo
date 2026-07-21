# Kpi

KPI card showing a primary metric with optional delta indicator, icon, and sparkline.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { Kpi } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // required — without it the screen-reader data-table fallback renders visibly
```

## Category

`chart`

## Props

| Prop         | Type               | Required | Default | Description                                              |
| ------------ | ------------------ | -------- | ------- | -------------------------------------------------------- |
| `value`      | `string \| number` | yes      | —       | Primary metric value                                     |
| `label`      | `string`           | yes      | —       | Metric label                                             |
| `delta`      | `number`           | no       | —       | Change value (positive = up, negative = down)            |
| `deltaLabel` | `string`           | no       | —       | Delta context label (e.g. "vs last week")                |
| `icon`       | `ReactNode`        | no       | —       | Icon element rendered in the component.                  |
| `sparkline`  | `number[]`         | no       | —       | Trend data for embedded sparkline                        |
| `className`  | `string`           | no       | —       | Additional CSS class names merged onto the root element. |

## Examples

### Basic KPI card

```tsx
import { Kpi } from '@cascivo/charts'
;<Kpi value="$12,400" label="Monthly revenue" delta={8.2} deltaLabel="vs last month" />
```

## Design tokens

- `--cascivo-chart-1`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `figure`

## Dependencies

- `@cascivo/charts`

## Tags

chart, kpi, metric, dashboard, data-viz

---

_Generated from registry v0.8.0 on 2026-07-21. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
