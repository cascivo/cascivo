# Histogram

Frequency histogram using Freedman–Diaconis binning with hover tooltips.

## Install

```bash
npx cascade add chart/histogram
```

## Category

`chart`

## Props

| Prop          | Type       | Required | Default | Description                                                           |
| ------------- | ---------- | -------- | ------- | --------------------------------------------------------------------- |
| `data`        | `number[]` | yes      | —       | Array of numeric values to bin                                        |
| `bins`        | `number`   | no       | —       | Explicit bin count (defaults to Freedman–Diaconis)                    |
| `title`       | `string`   | yes      | —       | —                                                                     |
| `label`       | `string`   | yes      | —       | X-axis label                                                          |
| `description` | `string`   | no       | —       | —                                                                     |
| `width`       | `number`   | no       | —       | —                                                                     |
| `height`      | `number`   | no       | `300`   | —                                                                     |
| `className`   | `string`   | no       | —       | —                                                                     |
| `plain`       | `boolean`  | no       | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts. |

## Examples

### Basic histogram

```tsx
import { Histogram } from '@cascade-ui/charts'

const data = Array.from({length:100}, () => Math.random() * 100)
<Histogram data={data} title="Distribution" label="Value" />
```

## Design tokens

- `--cascade-chart-1`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `img`

## Dependencies

- `@cascade-ui/charts`

## Tags

chart, histogram, distribution, frequency, data-viz
