# Stream

Streamgraph — stacked areas on a centered (silhouette) flowing baseline.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { Stream } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // required — without it the screen-reader data-table fallback renders visibly
```

## Category

`chart`

## Props

| Prop          | Type                     | Required | Default      | Description                                                           |
| ------------- | ------------------------ | -------- | ------------ | --------------------------------------------------------------------- |
| `series`      | `StreamSeries[]`         | yes      | —            | Series, each with values[] aligned to categories.                     |
| `categories`  | `(string \| number)[]`   | yes      | —            | X-axis labels aligned with each series values.                        |
| `title`       | `string`                 | yes      | —            | Title text for the component.                                         |
| `description` | `string`                 | no       | —            | Supporting description text.                                          |
| `offset`      | `'silhouette' \| 'zero'` | no       | `silhouette` | silhouette centers the stack (streamgraph); zero is a baseline stack. |
| `curve`       | `Curve`                  | no       | `basis`      | Interpolation curve.                                                  |
| `width`       | `number`                 | no       | —            | Width of the component.                                               |
| `height`      | `number`                 | no       | `300`        | Height of the component.                                              |
| `legend`      | `boolean`                | no       | —            | Whether to show the legend.                                           |
| `tooltip`     | `boolean`                | no       | —            | Whether to show tooltips on hover.                                    |
| `className`   | `string`                 | no       | —            | Additional CSS class names merged onto the root element.              |
| `plain`       | `boolean`                | no       | `false`      | When true, renders a minimal variant without chart chrome.            |

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

_Generated from registry v0.8.0 on 2026-07-20. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
