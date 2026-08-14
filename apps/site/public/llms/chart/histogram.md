# Histogram

Frequency histogram using Freedman–Diaconis binning with hover tooltips.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { Histogram } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // bundler: automatic. Needed only for no-bundler / SSR-externalised builds, where skipping it renders the screen-reader data-table fallback visibly
```

## Category

`chart`

## Props

| Prop          | Type                                          | Required | Default | Description                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------- | --------------------------------------------- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`        | `number[]`                                    | yes      | —       | Array of numeric values to bin                                                                                                                                                                                                                                                                                                                                                                |
| `bins`        | `number`                                      | no       | —       | Explicit bin count (defaults to Freedman–Diaconis)                                                                                                                                                                                                                                                                                                                                            |
| `title`       | `string`                                      | yes      | —       | Title text for the component.                                                                                                                                                                                                                                                                                                                                                                 |
| `label`       | `string`                                      | yes      | —       | X-axis label — rendered visibly beneath the axis.                                                                                                                                                                                                                                                                                                                                             |
| `description` | `string`                                      | no       | —       | Supporting description text.                                                                                                                                                                                                                                                                                                                                                                  |
| `width`       | `number`                                      | no       | —       | Fixed SVG width in px. ⚠ **Omit for a responsive chart** — the chart fills and tracks its container via a ResizeObserver; there is no correct pixel number in a responsive grid. A fixed width is clamped to the container (max-inline-size: 100%) so it can never overflow its card, but it also stops the chart growing. `useChartSize` is NOT needed for this — charts call it internally. |
| `height`      | `number`                                      | no       | `300`   | SVG height in px. Unlike `width`, height does NOT track the container — this is the knob you set to change the chart's aspect.                                                                                                                                                                                                                                                                |
| `className`   | `string`                                      | no       | —       | Additional CSS class names merged onto the root element.                                                                                                                                                                                                                                                                                                                                      |
| `plain`       | `boolean`                                     | no       | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts.                                                                                                                                                                                                                                                                                                                         |
| `format`      | `(value: number \| string \| Date) => string` | no       | —       | Format each X-axis tick label.                                                                                                                                                                                                                                                                                                                                                                |

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

_Generated from registry v0.17.0 on 2026-08-11. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
