# ComboChart

Combination bar + line chart on shared or dual y-axes.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { ComboChart } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // bundler: automatic. Needed only for no-bundler / SSR-externalised builds, where skipping it renders the screen-reader data-table fallback visibly
```

## Category

`chart`

## Props

| Prop          | Type                                          | Required | Default  | Description                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------- | --------------------------------------------- | -------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bars`        | `{ label: string; value: number }[]`          | yes      | —        | Bar series data                                                                                                                                                                                                                                                                                                                                                                               |
| `line`        | `{ x: number; y: number }[]`                  | yes      | —        | Line series data points                                                                                                                                                                                                                                                                                                                                                                       |
| `title`       | `string`                                      | yes      | —        | Title text for the component.                                                                                                                                                                                                                                                                                                                                                                 |
| `description` | `string`                                      | no       | —        | Supporting description text.                                                                                                                                                                                                                                                                                                                                                                  |
| `secondAxis`  | `boolean`                                     | no       | `false`  | Render line on a secondary right y-axis                                                                                                                                                                                                                                                                                                                                                       |
| `width`       | `number`                                      | no       | —        | Fixed SVG width in px. ⚠ **Omit for a responsive chart** — the chart fills and tracks its container via a ResizeObserver; there is no correct pixel number in a responsive grid. A fixed width is clamped to the container (max-inline-size: 100%) so it can never overflow its card, but it also stops the chart growing. `useChartSize` is NOT needed for this — charts call it internally. |
| `height`      | `number`                                      | no       | `320`    | SVG height in px. Unlike `width`, height does NOT track the container — this is the knob you set to change the chart's aspect.                                                                                                                                                                                                                                                                |
| `tooltip`     | `boolean`                                     | no       | —        | Enable hover/keyboard tooltip                                                                                                                                                                                                                                                                                                                                                                 |
| `className`   | `string`                                      | no       | —        | Additional CSS class names merged onto the root element.                                                                                                                                                                                                                                                                                                                                      |
| `plain`       | `boolean`                                     | no       | `false`  | Marks only — no axes, grid lines, or legend. For micro/inline charts.                                                                                                                                                                                                                                                                                                                         |
| `annotations` | `Annotation[]`                                | no       | —        | Reference lines, shaded bands, and markers drawn over the plot (e.g. a target/threshold line).                                                                                                                                                                                                                                                                                                |
| `barsLabel`   | `string`                                      | no       | `'Bars'` | Legend label for the bar series.                                                                                                                                                                                                                                                                                                                                                              |
| `format`      | `(value: number \| string \| Date) => string` | no       | —        | Format each X-axis tick label.                                                                                                                                                                                                                                                                                                                                                                |
| `legend`      | `boolean`                                     | no       | —        | Show the legend.                                                                                                                                                                                                                                                                                                                                                                              |
| `lineLabel`   | `string`                                      | no       | `'Line'` | Legend label for the line series.                                                                                                                                                                                                                                                                                                                                                             |
| `xLabelEvery` | `number`                                      | no       | —        | Render every Nth category label.                                                                                                                                                                                                                                                                                                                                                              |

## Object types

### `ComboChartBar`

Shape of the `bars` prop.

| Field   | Type     | Required | Description |
| ------- | -------- | -------- | ----------- |
| `label` | `string` | yes      | —           |
| `value` | `number` | yes      | —           |

### `ComboChartPoint`

Shape of the `line` prop.

| Field | Type     | Required | Description                                                      |
| ----- | -------- | -------- | ---------------------------------------------------------------- |
| `x`   | `number` | yes      | Index into `bars` — point `i` is drawn at the centre of bar `i`. |
| `y`   | `number` | yes      | —                                                                |

## Examples

### Basic combo chart

```tsx
import { ComboChart } from '@cascivo/charts'

const bars = [{label:'Jan',value:100},{label:'Feb',value:120},{label:'Mar',value:90}]
const line = [{x:0,y:50},{x:1,y:70},{x:2,y:60}]
<ComboChart bars={bars} line={line} title="Sales vs Target" />
```

## Client JavaScript

Enhancement only. The component still does its job with JavaScript disabled — the server-rendered HTML is correct and nothing is unreachable; client JS adds polish on top.

## Design tokens

- `--cascivo-chart-1`
- `--cascivo-chart-2`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `img`
- **Keyboard:** Tab (focus chart), ArrowLeft/ArrowRight (navigate points), Home/End (first/last point), Escape (clear focus)

## Dependencies

- `@cascivo/charts`

## Tags

chart, combo, bar, line, dual-axis, data-viz

---

_Generated from registry v1.0.0 on 2026-08-26. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
