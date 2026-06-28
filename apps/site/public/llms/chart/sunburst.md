# Sunburst

Radial hierarchy — concentric rings where each node is an annular segment sized by value.

## Install

Charts ship in the `@cascivo/charts` package:

```sh
pnpm add @cascivo/charts
```

```tsx
import { Sunburst } from '@cascivo/charts'
```

## Category

`chart`

## Props

| Prop          | Type       | Required | Default | Description                                                       |
| ------------- | ---------- | -------- | ------- | ----------------------------------------------------------------- |
| `data`        | `HierNode` | yes      | —       | Root of the tree; leaves carry value, parents sum their children. |
| `title`       | `string`   | yes      | —       | —                                                                 |
| `description` | `string`   | no       | —       | —                                                                 |
| `size`        | `number`   | no       | —       | Square shorthand (width === height).                              |
| `width`       | `number`   | no       | —       | —                                                                 |
| `height`      | `number`   | no       | `300`   | —                                                                 |
| `tooltip`     | `boolean`  | no       | —       | —                                                                 |
| `className`   | `string`   | no       | —       | —                                                                 |
| `plain`       | `boolean`  | no       | `false` | —                                                                 |

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
