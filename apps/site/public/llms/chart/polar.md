# Polar

A polar coordinate plot — categories around the circle, value as radius. Bars (a rose), or a polar line/area.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { Polar } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // bundler: automatic. Needed only for no-bundler / SSR-externalised builds, where skipping it renders the screen-reader data-table fallback visibly
```

## Category

`chart`

## Props

| Prop          | Type                        | Required | Default | Description                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------- | --------------------------- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`        | `PolarDatum[]`              | yes      | —       | One entry per category: { label, value, color? }.                                                                                                                                                                                                                                                                                                                                             |
| `title`       | `string`                    | yes      | —       | Chart title (also aria-label).                                                                                                                                                                                                                                                                                                                                                                |
| `description` | `string`                    | no       | —       | Supporting description text.                                                                                                                                                                                                                                                                                                                                                                  |
| `mode`        | `'bar' \| 'line' \| 'area'` | no       | `bar`   | Bars (rose), a polar line, or a filled polar area.                                                                                                                                                                                                                                                                                                                                            |
| `width`       | `number`                    | no       | —       | Fixed SVG width in px. ⚠ **Omit for a responsive chart** — the chart fills and tracks its container via a ResizeObserver; there is no correct pixel number in a responsive grid. A fixed width is clamped to the container (max-inline-size: 100%) so it can never overflow its card, but it also stops the chart growing. `useChartSize` is NOT needed for this — charts call it internally. |
| `height`      | `number`                    | no       | `320`   | SVG height in px. Unlike `width`, height does NOT track the container — this is the knob you set to change the chart's aspect.                                                                                                                                                                                                                                                                |
| `rings`       | `number`                    | no       | `4`     | Radial ring count.                                                                                                                                                                                                                                                                                                                                                                            |
| `max`         | `number`                    | no       | —       | Domain top (full radius). Defaults to the largest value.                                                                                                                                                                                                                                                                                                                                      |
| `tooltip`     | `boolean`                   | no       | —       | Enable hover tooltip.                                                                                                                                                                                                                                                                                                                                                                         |
| `className`   | `string`                    | no       | —       | Additional CSS class names merged onto the root element.                                                                                                                                                                                                                                                                                                                                      |
| `plain`       | `boolean`                   | no       | `false` | Marks only — no rings or labels. For micro/inline charts.                                                                                                                                                                                                                                                                                                                                     |

## Object types

### `PolarDatum`

Shape of the `data` prop.

| Field   | Type     | Required | Description |
| ------- | -------- | -------- | ----------- |
| `label` | `string` | yes      | —           |
| `value` | `number` | yes      | —           |
| `color` | `string` | no       | —           |

## Examples

### Wind rose

```tsx
import { Polar } from '@cascivo/charts'
;<Polar
  title="Wind by direction"
  mode="bar"
  tooltip
  data={[
    { label: 'N', value: 12 },
    { label: 'E', value: 8 },
    { label: 'S', value: 5 },
    { label: 'W', value: 15 },
  ]}
/>
```

## Client JavaScript

Enhancement only. The component still does its job with JavaScript disabled — the server-rendered HTML is correct and nothing is unreachable; client JS adds polish on top.

## Design tokens

- `--cascivo-chart-1`
- `--cascivo-chart-2`
- `--cascivo-chart-3`
- `--cascivo-chart-4`
- `--cascivo-chart-5`
- `--cascivo-chart-6`
- `--cascivo-chart-7`
- `--cascivo-chart-8`
- `--cascivo-chart-grid`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `img`
- **Keyboard:** Tab (focus chart), ArrowLeft/ArrowRight (navigate), Escape (clear focus)

## Dependencies

- `@cascivo/charts`

## Tags

chart, polar, rose, radial, data-viz

---

_Generated from registry v0.17.1 on 2026-08-11. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
