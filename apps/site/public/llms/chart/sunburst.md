# Sunburst

Radial hierarchy — concentric rings where each node is an annular segment sized by value.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { Sunburst } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // bundler: automatic. Needed only for no-bundler / SSR-externalised builds, where skipping it renders the screen-reader data-table fallback visibly
```

## Category

`chart`

## Props

| Prop          | Type       | Required | Default | Description                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------- | ---------- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`        | `HierNode` | yes      | —       | Root of the tree; leaves carry value, parents sum their children.                                                                                                                                                                                                                                                                                                                             |
| `title`       | `string`   | yes      | —       | Title text for the component.                                                                                                                                                                                                                                                                                                                                                                 |
| `description` | `string`   | no       | —       | Supporting description text.                                                                                                                                                                                                                                                                                                                                                                  |
| `size`        | `number`   | no       | —       | Square shorthand (width === height).                                                                                                                                                                                                                                                                                                                                                          |
| `width`       | `number`   | no       | —       | Fixed SVG width in px. ⚠ **Omit for a responsive chart** — the chart fills and tracks its container via a ResizeObserver; there is no correct pixel number in a responsive grid. A fixed width is clamped to the container (max-inline-size: 100%) so it can never overflow its card, but it also stops the chart growing. `useChartSize` is NOT needed for this — charts call it internally. |
| `height`      | `number`   | no       | `300`   | SVG height in px. Unlike `width`, height does NOT track the container — this is the knob you set to change the chart's aspect.                                                                                                                                                                                                                                                                |
| `tooltip`     | `boolean`  | no       | —       | Whether to show tooltips on hover.                                                                                                                                                                                                                                                                                                                                                            |
| `className`   | `string`   | no       | —       | Additional CSS class names merged onto the root element.                                                                                                                                                                                                                                                                                                                                      |
| `plain`       | `boolean`  | no       | `false` | When true, renders a minimal variant without chart chrome.                                                                                                                                                                                                                                                                                                                                    |

## Object types

### `HierNode`

Shape of the `data` prop.

| Field      | Type         | Required | Description |
| ---------- | ------------ | -------- | ----------- |
| `id`       | `string`     | no       | —           |
| `label`    | `string`     | yes      | —           |
| `value`    | `number`     | no       | —           |
| `color`    | `string`     | no       | —           |
| `children` | `HierNode[]` | no       | —           |

## Examples

### Sunburst

```tsx
import { Sunburst } from '@cascivo/charts'
;<Sunburst
  title="Disk usage"
  data={{
    label: 'root',
    children: [
      {
        label: 'src',
        children: [
          { label: 'app', value: 40 },
          { label: 'lib', value: 25 },
        ],
      },
      { label: 'docs', value: 15 },
    ],
  }}
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

chart, sunburst, hierarchy, radial, data-viz

---

_Generated from registry v0.18.0 on 2026-08-17. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
