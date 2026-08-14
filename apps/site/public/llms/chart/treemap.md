# Treemap

Squarified treemap for visualizing part-to-whole hierarchical data.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { Treemap } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // bundler: automatic. Needed only for no-bundler / SSR-externalised builds, where skipping it renders the screen-reader data-table fallback visibly
```

## Category

`chart`

## Props

| Prop          | Type                                             | Required | Default | Description                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------- | ------------------------------------------------ | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`        | `{ id: string; label: string; value: number }[]` | yes      | —       | The hierarchical data to render as nested rectangles.                                                                                                                                                                                                                                                                                                                                         |
| `title`       | `string`                                         | yes      | —       | Title text for the component.                                                                                                                                                                                                                                                                                                                                                                 |
| `description` | `string`                                         | no       | —       | Supporting description text.                                                                                                                                                                                                                                                                                                                                                                  |
| `width`       | `number`                                         | no       | —       | Fixed SVG width in px. ⚠ **Omit for a responsive chart** — the chart fills and tracks its container via a ResizeObserver; there is no correct pixel number in a responsive grid. A fixed width is clamped to the container (max-inline-size: 100%) so it can never overflow its card, but it also stops the chart growing. `useChartSize` is NOT needed for this — charts call it internally. |
| `height`      | `number`                                         | no       | `320`   | SVG height in px. Unlike `width`, height does NOT track the container — this is the knob you set to change the chart's aspect.                                                                                                                                                                                                                                                                |
| `className`   | `string`                                         | no       | —       | Additional CSS class names merged onto the root element.                                                                                                                                                                                                                                                                                                                                      |
| `plain`       | `boolean`                                        | no       | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts.                                                                                                                                                                                                                                                                                                                         |

## Object types

### `TreemapDatum`

Shape of the `data` prop.

| Field   | Type     | Required | Description |
| ------- | -------- | -------- | ----------- |
| `id`    | `string` | yes      | —           |
| `label` | `string` | yes      | —           |
| `value` | `number` | yes      | —           |

## Examples

### Basic treemap

```tsx
import { Treemap } from '@cascivo/charts'

const data = [
  {id:'a',label:'Alpha',value:40},
  {id:'b',label:'Beta',value:25},
  {id:'c',label:'Gamma',value:20},
  {id:'d',label:'Delta',value:15},
]
<Treemap data={data} title="Market share" />
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

chart, treemap, hierarchy, part-to-whole, data-viz

---

_Generated from registry v0.17.1 on 2026-08-11. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
