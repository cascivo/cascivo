# Histogram

Frequency histogram using Freedman–Diaconis binning with hover tooltips.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { Histogram } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // required — without it the screen-reader data-table fallback renders visibly
```

## Category

`chart`

## Props

| Prop          | Type       | Required | Default | Description                                                           |
| ------------- | ---------- | -------- | ------- | --------------------------------------------------------------------- |
| `data`        | `number[]` | yes      | —       | Array of numeric values to bin                                        |
| `bins`        | `number`   | no       | —       | Explicit bin count (defaults to Freedman–Diaconis)                    |
| `title`       | `string`   | yes      | —       | Title text for the component.                                         |
| `label`       | `string`   | yes      | —       | X-axis label                                                          |
| `description` | `string`   | no       | —       | Supporting description text.                                          |
| `width`       | `number`   | no       | —       | Width of the component.                                               |
| `height`      | `number`   | no       | `300`   | Height of the component.                                              |
| `className`   | `string`   | no       | —       | Additional CSS class names merged onto the root element.              |
| `plain`       | `boolean`  | no       | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts. |

## Examples

### Basic histogram

```tsx
import { Histogram } from '@cascivo/charts'

const data = Array.from({length:100}, () => Math.random() * 100)
<Histogram data={data} title="Distribution" label="Value" />
```

## Design tokens

- `--cascivo-chart-1`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `img`

## Dependencies

- `@cascivo/charts`

## Tags

chart, histogram, distribution, frequency, data-viz

---

_Generated from registry v0.7.1 on 2026-07-20. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
