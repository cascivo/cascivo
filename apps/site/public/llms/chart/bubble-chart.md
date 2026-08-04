# BubbleChart

Bubble chart mapping x, y, and size dimensions; radius is area-proportional via sqrt scale.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { BubbleChart } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // required — without it the screen-reader data-table fallback renders visibly
```

## Category

`chart`

## Props

| Prop          | Type                                                                 | Required | Default | Description                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------- | -------------------------------------------------------------------- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `series`      | `{ name: string; data: { x: number; y: number; size: number }[] }[]` | yes      | —       | The data series to plot.                                                                                                                                                                                                                                                                                                                                                                      |
| `title`       | `string`                                                             | yes      | —       | Title text for the component.                                                                                                                                                                                                                                                                                                                                                                 |
| `description` | `string`                                                             | no       | —       | Supporting description text.                                                                                                                                                                                                                                                                                                                                                                  |
| `width`       | `number`                                                             | no       | —       | Fixed SVG width in px. ⚠ **Omit for a responsive chart** — the chart fills and tracks its container via a ResizeObserver; there is no correct pixel number in a responsive grid. A fixed width is clamped to the container (max-inline-size: 100%) so it can never overflow its card, but it also stops the chart growing. `useChartSize` is NOT needed for this — charts call it internally. |
| `height`      | `number`                                                             | no       | `320`   | SVG height in px. Unlike `width`, height does NOT track the container — this is the knob you set to change the chart's aspect.                                                                                                                                                                                                                                                                |
| `tooltip`     | `boolean`                                                            | no       | —       | Enable hover/keyboard tooltip                                                                                                                                                                                                                                                                                                                                                                 |
| `className`   | `string`                                                             | no       | —       | Additional CSS class names merged onto the root element.                                                                                                                                                                                                                                                                                                                                      |
| `plain`       | `boolean`                                                            | no       | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts.                                                                                                                                                                                                                                                                                                                         |
| `glyph`       | `GlyphShape \| ((d, seriesId) => GlyphShape)`                        | no       | —       | Point glyph shape (circle/square/diamond/triangle/cross/star) — a fixed shape or a function to encode a category by shape.                                                                                                                                                                                                                                                                    |

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

---

_Generated from registry v0.15.0 on 2026-08-03. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
