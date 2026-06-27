# BubbleChart

Bubble chart mapping x, y, and size dimensions; radius is area-proportional via sqrt scale.

## Install

Charts ship in the `@cascivo/charts` package:

```sh
pnpm add @cascivo/charts
```

```tsx
import { BubbleChart } from '@cascivo/charts'
```

## Category

`chart`

## Props

| Prop          | Type                                                                 | Required                       | Default | Description                                                           |
| ------------- | -------------------------------------------------------------------- | ------------------------------ | ------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `series`      | `{ name: string; data: { x: number; y: number; size: number }[] }[]` | yes                            | —       | —                                                                     |
| `title`       | `string`                                                             | yes                            | —       | —                                                                     |
| `description` | `string`                                                             | no                             | —       | —                                                                     |
| `width`       | `number`                                                             | no                             | —       | —                                                                     |
| `height`      | `number`                                                             | no                             | `320`   | —                                                                     |
| `tooltip`     | `boolean`                                                            | no                             | —       | Enable hover/keyboard tooltip                                         |
| `className`   | `string`                                                             | no                             | —       | —                                                                     |
| `plain`       | `boolean`                                                            | no                             | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts. |
| `glyph`       | `GlyphShape                                                          | ((d, seriesId) => GlyphShape)` | no      | —                                                                     | Point glyph shape (circle/square/diamond/triangle/cross/star) — a fixed shape or a function to encode a category by shape. |

## Examples

### Basic bubble chart

```tsx
import { BubbleChart } from '@cascivo/charts'

const series = [{ name: 'Group A', data: [{x:1,y:2,size:10},{x:3,y:4,size:30}] }]
<BubbleChart series={series} title="Bubble" />
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
- **Keyboard:** Tab (focus chart), ArrowLeft/ArrowRight (navigate points), Home/End (first/last point), Escape (clear focus)

## Dependencies

- `@cascivo/charts`

## Tags

chart, bubble, scatter, three-dimensional, data-viz
