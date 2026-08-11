# Bullet

Bullet chart with background range bands, measure bar, and target tick.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { Bullet } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // required — without it the screen-reader data-table fallback renders visibly
```

## Category

`chart`

## Props

| Prop        | Type       | Required | Default | Description                                                                                                                                                                                                                                                                                                                          |
| ----------- | ---------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `value`     | `number`   | yes      | —       | Current measure value                                                                                                                                                                                                                                                                                                                |
| `target`    | `number`   | yes      | —       | Target marker value                                                                                                                                                                                                                                                                                                                  |
| `ranges`    | `number[]` | yes      | —       | Qualitative range breakpoints (sorted ascending)                                                                                                                                                                                                                                                                                     |
| `label`     | `string`   | yes      | —       | Text label for the control.                                                                                                                                                                                                                                                                                                          |
| `min`       | `number`   | no       | `0`     | Minimum allowed value.                                                                                                                                                                                                                                                                                                               |
| `max`       | `number`   | no       | —       | Domain maximum (defaults to last range)                                                                                                                                                                                                                                                                                              |
| `width`     | `number`   | no       | `300`   | SVG width in px. **This chart is fixed-width by default** — it is a compact, inline chart meant to sit in a table cell or beside a label, so omitting `width` gives you 300px rather than a container-filling chart. Pass a number to change it. The catalogue-wide "omit for a responsive chart" note does not apply to this chart. |
| `height`    | `number`   | no       | `40`    | SVG height in px. Unlike `width`, height does NOT track the container — this is the knob you set to change the chart's aspect.                                                                                                                                                                                                       |
| `className` | `string`   | no       | —       | Additional CSS class names merged onto the root element.                                                                                                                                                                                                                                                                             |

## Examples

### Basic bullet chart

```tsx
import { Bullet } from '@cascivo/charts'
;<Bullet value={72} target={80} ranges={[40, 70, 100]} label="Revenue %" />
```

## Design tokens

- `--cascivo-chart-1`
- `--cascivo-gray-200`
- `--cascivo-gray-300`
- `--cascivo-gray-400`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `img`

## Dependencies

- `@cascivo/charts`

## Tags

chart, bullet, kpi, progress, data-viz

---

_Generated from registry v0.17.1 on 2026-08-11. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
