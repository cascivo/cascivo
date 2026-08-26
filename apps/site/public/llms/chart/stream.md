# Stream

Streamgraph — stacked areas on a centered (silhouette) flowing baseline.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { Stream } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // bundler: automatic. Needed only for no-bundler / SSR-externalised builds, where skipping it renders the screen-reader data-table fallback visibly
```

## Category

`chart`

## Props

| Prop          | Type                                          | Required | Default      | Description                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------- | --------------------------------------------- | -------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `series`      | `StreamSeries[]`                              | yes      | —            | Series, each with values[] aligned to categories.                                                                                                                                                                                                                                                                                                                                             |
| `categories`  | `(string \| number)[]`                        | yes      | —            | X-axis labels aligned with each series values.                                                                                                                                                                                                                                                                                                                                                |
| `title`       | `string`                                      | yes      | —            | Title text for the component.                                                                                                                                                                                                                                                                                                                                                                 |
| `description` | `string`                                      | no       | —            | Supporting description text.                                                                                                                                                                                                                                                                                                                                                                  |
| `offset`      | `'silhouette' \| 'zero'`                      | no       | `silhouette` | silhouette centers the stack (streamgraph); zero is a baseline stack.                                                                                                                                                                                                                                                                                                                         |
| `curve`       | `Curve`                                       | no       | `basis`      | Interpolation curve.                                                                                                                                                                                                                                                                                                                                                                          |
| `width`       | `number`                                      | no       | —            | Fixed SVG width in px. ⚠ **Omit for a responsive chart** — the chart fills and tracks its container via a ResizeObserver; there is no correct pixel number in a responsive grid. A fixed width is clamped to the container (max-inline-size: 100%) so it can never overflow its card, but it also stops the chart growing. `useChartSize` is NOT needed for this — charts call it internally. |
| `height`      | `number`                                      | no       | `300`        | SVG height in px. Unlike `width`, height does NOT track the container — this is the knob you set to change the chart's aspect.                                                                                                                                                                                                                                                                |
| `legend`      | `boolean`                                     | no       | —            | Whether to show the legend.                                                                                                                                                                                                                                                                                                                                                                   |
| `tooltip`     | `boolean`                                     | no       | —            | Whether to show tooltips on hover.                                                                                                                                                                                                                                                                                                                                                            |
| `className`   | `string`                                      | no       | —            | Additional CSS class names merged onto the root element.                                                                                                                                                                                                                                                                                                                                      |
| `plain`       | `boolean`                                     | no       | `false`      | When true, renders a minimal variant without chart chrome.                                                                                                                                                                                                                                                                                                                                    |
| `format`      | `(value: number \| string \| Date) => string` | no       | —            | Format each category/x-axis tick label.                                                                                                                                                                                                                                                                                                                                                       |

## Object types

### `StreamSeries`

Shape of the `series` prop.

| Field    | Type       | Required | Description                                        |
| -------- | ---------- | -------- | -------------------------------------------------- |
| `id`     | `string`   | yes      | —                                                  |
| `label`  | `string`   | yes      | —                                                  |
| `values` | `number[]` | yes      | One value per category, aligned with `categories`. |
| `color`  | `string`   | no       | —                                                  |

## Examples

### Streamgraph

```tsx
import { Stream } from '@cascivo/charts'
;<Stream
  title="Topics over time"
  categories={['Jan', 'Feb', 'Mar', 'Apr']}
  series={[
    { id: 'a', label: 'A', values: [4, 6, 5, 8] },
    { id: 'b', label: 'B', values: [2, 3, 7, 4] },
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

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `img`
- **Keyboard:** Tab (focus chart), ArrowLeft/ArrowRight (navigate), Escape (clear focus)

## Dependencies

- `@cascivo/charts`

## Tags

chart, stream, streamgraph, area, data-viz

---

_Generated from registry v1.0.0 on 2026-08-26. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
