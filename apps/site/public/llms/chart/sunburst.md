# Sunburst

Radial hierarchy — concentric rings where each node is an annular segment sized by value.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { Sunburst } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // required — without it the screen-reader data-table fallback renders visibly
```

## Category

`chart`

## Props

| Prop          | Type       | Required | Default | Description                                                       |
| ------------- | ---------- | -------- | ------- | ----------------------------------------------------------------- |
| `data`        | `HierNode` | yes      | —       | Root of the tree; leaves carry value, parents sum their children. |
| `title`       | `string`   | yes      | —       | Title text for the component.                                     |
| `description` | `string`   | no       | —       | Supporting description text.                                      |
| `size`        | `number`   | no       | —       | Square shorthand (width === height).                              |
| `width`       | `number`   | no       | —       | Width of the component.                                           |
| `height`      | `number`   | no       | `300`   | Height of the component.                                          |
| `tooltip`     | `boolean`  | no       | —       | Whether to show tooltips on hover.                                |
| `className`   | `string`   | no       | —       | Additional CSS class names merged onto the root element.          |
| `plain`       | `boolean`  | no       | `false` | When true, renders a minimal variant without chart chrome.        |

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

_Generated from registry v0.10.0 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
