# RadialBar

Concentric radial bars (a circular gauge family) — each datum is a ring whose sweep is proportional to its value.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { RadialBar } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // required — without it the screen-reader data-table fallback renders visibly
```

## Category

`chart`

## Props

| Prop          | Type               | Required | Default | Description                                                                    |
| ------------- | ------------------ | -------- | ------- | ------------------------------------------------------------------------------ |
| `data`        | `RadialBarDatum[]` | yes      | —       | One ring per datum: { id, label, value, color? }.                              |
| `title`       | `string`           | yes      | —       | Chart title (also used as aria-label).                                         |
| `description` | `string`           | no       | —       | Subtitle below the title.                                                      |
| `size`        | `number`           | no       | —       | Square shorthand (width === height). Explicit width/height win.                |
| `width`       | `number`           | no       | —       | Width of the component.                                                        |
| `height`      | `number`           | no       | `300`   | Height of the component.                                                       |
| `max`         | `number`           | no       | —       | Domain top — the value a full sweep represents. Defaults to the largest datum. |
| `sweep`       | `number`           | no       | `270`   | Sweep angle in degrees (270 = a gauge arc; 360 = a full ring).                 |
| `centerValue` | `string`           | no       | —       | Text in the hole.                                                              |
| `centerLabel` | `string`           | no       | —       | Caption below centerValue.                                                     |
| `centerSlot`  | `ReactNode`        | no       | —       | Arbitrary hole content; wins over centerValue/centerLabel.                     |
| `tooltip`     | `boolean`          | no       | —       | Enable hover tooltip.                                                          |
| `legend`      | `boolean`          | no       | —       | Show ring legend.                                                              |
| `className`   | `string`           | no       | —       | Additional CSS class names merged onto the root element.                       |
| `plain`       | `boolean`          | no       | `false` | Marks only — no legend. For micro/inline charts.                               |

## Examples

### Goal progress rings

```tsx
import { RadialBar } from '@cascivo/charts'
;<RadialBar
  title="Quarterly goals"
  max={100}
  centerValue="72%"
  centerLabel="On track"
  data={[
    { id: 'rev', label: 'Revenue', value: 84 },
    { id: 'nps', label: 'NPS', value: 61 },
    { id: 'ret', label: 'Retention', value: 72 },
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
- `--cascivo-chart-grid`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `img`
- **Keyboard:** Tab (focus chart), ArrowLeft/ArrowRight (navigate rings), Escape (clear focus)

## Dependencies

- `@cascivo/charts`

## Tags

chart, radial, gauge, progress, data-viz

---

_Generated from registry v0.10.0 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
