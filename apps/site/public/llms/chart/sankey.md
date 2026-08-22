# Sankey

Flow diagram — ranked nodes connected by throughput-sized link ribbons.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { Sankey } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // bundler: automatic. Needed only for no-bundler / SSR-externalised builds, where skipping it renders the screen-reader data-table fallback visibly
```

## Category

`chart`

## Props

| Prop          | Type           | Required | Default | Description                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------- | -------------- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nodes`       | `SankeyNode[]` | yes      | —       | Nodes: { id, label, color? }.                                                                                                                                                                                                                                                                                                                                                                 |
| `links`       | `SankeyLink[]` | yes      | —       | Links: { source, target, value }.                                                                                                                                                                                                                                                                                                                                                             |
| `title`       | `string`       | yes      | —       | Title text for the component.                                                                                                                                                                                                                                                                                                                                                                 |
| `description` | `string`       | no       | —       | Supporting description text.                                                                                                                                                                                                                                                                                                                                                                  |
| `width`       | `number`       | no       | —       | Fixed SVG width in px. ⚠ **Omit for a responsive chart** — the chart fills and tracks its container via a ResizeObserver; there is no correct pixel number in a responsive grid. A fixed width is clamped to the container (max-inline-size: 100%) so it can never overflow its card, but it also stops the chart growing. `useChartSize` is NOT needed for this — charts call it internally. |
| `height`      | `number`       | no       | `320`   | SVG height in px. Unlike `width`, height does NOT track the container — this is the knob you set to change the chart's aspect.                                                                                                                                                                                                                                                                |
| `tooltip`     | `boolean`      | no       | —       | Whether to show tooltips on hover.                                                                                                                                                                                                                                                                                                                                                            |
| `className`   | `string`       | no       | —       | Additional CSS class names merged onto the root element.                                                                                                                                                                                                                                                                                                                                      |
| `plain`       | `boolean`      | no       | `false` | When true, renders a minimal variant without chart chrome.                                                                                                                                                                                                                                                                                                                                    |

## Object types

### `SankeyLink`

Shape of the `links` prop.

| Field    | Type     | Required | Description |
| -------- | -------- | -------- | ----------- |
| `source` | `string` | yes      | —           |
| `target` | `string` | yes      | —           |
| `value`  | `number` | yes      | —           |

### `SankeyNode`

Shape of the `nodes` prop.

| Field   | Type     | Required | Description |
| ------- | -------- | -------- | ----------- |
| `id`    | `string` | yes      | —           |
| `label` | `string` | yes      | —           |
| `color` | `string` | no       | —           |

## Examples

### Sankey flow

```tsx
import { Sankey } from '@cascivo/charts'
;<Sankey
  title="Traffic flow"
  nodes={[
    { id: 'a', label: 'Search' },
    { id: 'b', label: 'Home' },
    { id: 'c', label: 'Signup' },
  ]}
  links={[
    { source: 'a', target: 'b', value: 30 },
    { source: 'b', target: 'c', value: 12 },
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
- **Keyboard:** Tab (focus chart), ArrowLeft/ArrowRight (navigate nodes), Escape (clear focus)

## Dependencies

- `@cascivo/charts`

## Tags

chart, sankey, flow, network, data-viz

---

_Generated from registry v0.18.0 on 2026-08-17. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
