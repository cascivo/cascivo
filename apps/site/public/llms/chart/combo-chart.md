# ComboChart

Combination bar + line chart on shared or dual y-axes.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { ComboChart } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // required — without it the screen-reader data-table fallback renders visibly
```

## Category

`chart`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `bars` | `{ label: string; value: number }[]` | yes | — | Bar series data |
| `line` | `{ x: number; y: number }[]` | yes | — | Line series data points |
| `title` | `string` | yes | — | Title text for the component. |
| `description` | `string` | no | — | Supporting description text. |
| `secondAxis` | `boolean` | no | — | Render line on a secondary right y-axis |
| `width` | `number` | no | — | Width of the component. |
| `height` | `number` | no | `320` | Height of the component. |
| `tooltip` | `boolean` | no | — | Enable hover/keyboard tooltip |
| `className` | `string` | no | — | Additional CSS class names merged onto the root element. |
| `plain` | `boolean` | no | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts. |
| `annotations` | `Annotation[]` | no | — | Reference lines, shaded bands, and markers drawn over the plot (e.g. a target/threshold line). |

## Examples

### Basic combo chart

```tsx
import { ComboChart } from '@cascivo/charts'

const bars = [{label:'Jan',value:100},{label:'Feb',value:120},{label:'Mar',value:90}]
const line = [{x:0,y:50},{x:1,y:70},{x:2,y:60}]
<ComboChart bars={bars} line={line} title="Sales vs Target" />
```

## Design tokens

- `--cascivo-chart-1`
- `--cascivo-chart-2`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `img`
- **Keyboard:** Tab (focus chart), ArrowLeft/ArrowRight (navigate points), Home/End (first/last point), Escape (clear focus)

## Dependencies

- `@cascivo/charts`

## Tags

chart, combo, bar, line, dual-axis, data-viz

---

_Generated from registry v0.9.0 on 2026-07-22. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
