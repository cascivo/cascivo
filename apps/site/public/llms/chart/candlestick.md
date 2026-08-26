# Candlestick

OHLC financial chart — each period a high–low wick and an open↔close body, coloured up/down.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { Candlestick } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // bundler: automatic. Needed only for no-bundler / SSR-externalised builds, where skipping it renders the screen-reader data-table fallback visibly
```

## Category

`chart`

## Props

| Prop          | Type                                          | Required | Default                    | Description                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------- | --------------------------------------------- | -------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`        | `CandlestickDatum[]`                          | yes      | —                          | One candle per period: { t, open, high, low, close, volume? }.                                                                                                                                                                                                                                                                                                                                |
| `title`       | `string`                                      | yes      | —                          | Chart title (also aria-label).                                                                                                                                                                                                                                                                                                                                                                |
| `description` | `string`                                      | no       | —                          | Supporting description text.                                                                                                                                                                                                                                                                                                                                                                  |
| `width`       | `number`                                      | no       | —                          | Fixed SVG width in px. ⚠ **Omit for a responsive chart** — the chart fills and tracks its container via a ResizeObserver; there is no correct pixel number in a responsive grid. A fixed width is clamped to the container (max-inline-size: 100%) so it can never overflow its card, but it also stops the chart growing. `useChartSize` is NOT needed for this — charts call it internally. |
| `height`      | `number`                                      | no       | `320`                      | SVG height in px. Unlike `width`, height does NOT track the container — this is the knob you set to change the chart's aspect.                                                                                                                                                                                                                                                                |
| `yTicks`      | `number`                                      | no       | `5`                        | Approximate number of ticks on the y-axis.                                                                                                                                                                                                                                                                                                                                                    |
| `upColor`     | `string`                                      | no       | `'var(--cascivo-chart-2)'` | Colour for up candles (close ≥ open).                                                                                                                                                                                                                                                                                                                                                         |
| `downColor`   | `string`                                      | no       | `'var(--cascivo-chart-4)'` | Colour for down candles (close < open).                                                                                                                                                                                                                                                                                                                                                       |
| `volume`      | `boolean`                                     | no       | `false`                    | Render volume bars beneath the candles.                                                                                                                                                                                                                                                                                                                                                       |
| `tooltip`     | `boolean`                                     | no       | —                          | Enable hover tooltip (OHLC).                                                                                                                                                                                                                                                                                                                                                                  |
| `className`   | `string`                                      | no       | —                          | Additional CSS class names merged onto the root element.                                                                                                                                                                                                                                                                                                                                      |
| `plain`       | `boolean`                                     | no       | `false`                    | Marks only — no axes. For micro/inline charts.                                                                                                                                                                                                                                                                                                                                                |
| `annotations` | `Annotation[]`                                | no       | —                          | Reference lines/bands/markers over the plot (e.g. a last-price rule).                                                                                                                                                                                                                                                                                                                         |
| `brush`       | `boolean`                                     | no       | —                          | Keyboard-operable Brush below the plot to subset the candles to a window.                                                                                                                                                                                                                                                                                                                     |
| `dataZoom`    | `boolean`                                     | no       | —                          | DataZoom slider below the plot — a Brush whose body also pans the window.                                                                                                                                                                                                                                                                                                                     |
| `zoom`        | `boolean`                                     | no       | —                          | In-plot wheel/drag/keyboard zoom-pan (+/-/0) over the candle index window.                                                                                                                                                                                                                                                                                                                    |
| `syncId`      | `string`                                      | no       | —                          | Connect charts sharing this id — they mirror the zoom window.                                                                                                                                                                                                                                                                                                                                 |
| `tooltipMode` | `'item' \| 'axis'`                            | no       | `item`                     | item (nearest candle) or axis (crosshair + OHLC at the hovered x).                                                                                                                                                                                                                                                                                                                            |
| `format`      | `(value: number \| string \| Date) => string` | no       | —                          | Format each X-axis tick label.                                                                                                                                                                                                                                                                                                                                                                |

## Object types

### `CandlestickDatum`

Shape of the `data` prop.

| Field    | Type     | Required | Description                             |
| -------- | -------- | -------- | --------------------------------------- |
| `t`      | `string` | yes      | Period label (date string or index).    |
| `open`   | `number` | yes      | —                                       |
| `high`   | `number` | yes      | —                                       |
| `low`    | `number` | yes      | —                                       |
| `close`  | `number` | yes      | —                                       |
| `volume` | `number` | no       | Render volume bars beneath the candles. |

## Examples

### OHLC price series

```tsx
import { Candlestick } from '@cascivo/charts'
;<Candlestick
  title="ACME daily"
  tooltip
  data={[
    { t: 'Mon', open: 10, high: 14, low: 9, close: 13 },
    { t: 'Tue', open: 13, high: 15, low: 11, close: 11 },
    { t: 'Wed', open: 11, high: 12, low: 8, close: 9 },
  ]}
/>
```

### Zoomable with a last-price rule

```tsx
<Candlestick
  title="ACME daily"
  data={candles}
  volume
  zoom
  dataZoom
  tooltipMode="axis"
  annotations={[{ kind: 'line', axis: 'y', value: lastClose, label: '42.77' }]}
/>
```

## Client JavaScript

Enhancement only. The component still does its job with JavaScript disabled — the server-rendered HTML is correct and nothing is unreachable; client JS adds polish on top.

## Design tokens

- `--cascivo-chart-2`
- `--cascivo-chart-4`
- `--cascivo-chart-grid`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `img`
- **Keyboard:** Tab (focus chart), ArrowLeft/ArrowRight (navigate candles), +/- (zoom), 0 (reset) when zoom enabled, Escape (clear focus)

## Dependencies

- `@cascivo/charts`

## Tags

chart, candlestick, ohlc, financial, data-viz

---

_Generated from registry v1.0.0 on 2026-08-26. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
