# Candlestick

OHLC financial chart — each period a high–low wick and an open↔close body, coloured up/down.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { Candlestick } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // required — without it the screen-reader data-table fallback renders visibly
```

## Category

`chart`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | `CandlestickDatum[]` | yes | — | One candle per period: { t, open, high, low, close, volume? }. |
| `title` | `string` | yes | — | Chart title (also aria-label). |
| `description` | `string` | no | — | Supporting description text. |
| `width` | `number` | no | — | Width of the component. |
| `height` | `number` | no | `320` | Height of the component. |
| `yTicks` | `number` | no | `5` | Approximate number of ticks on the y-axis. |
| `upColor` | `string` | no | — | Colour for up candles (close ≥ open). |
| `downColor` | `string` | no | — | Colour for down candles (close < open). |
| `volume` | `boolean` | no | `false` | Render volume bars beneath the candles. |
| `tooltip` | `boolean` | no | — | Enable hover tooltip (OHLC). |
| `className` | `string` | no | — | Additional CSS class names merged onto the root element. |
| `plain` | `boolean` | no | `false` | Marks only — no axes. For micro/inline charts. |
| `annotations` | `Annotation[]` | no | — | Reference lines/bands/markers over the plot (e.g. a last-price rule). |
| `brush` | `boolean` | no | — | Keyboard-operable Brush below the plot to subset the candles to a window. |
| `dataZoom` | `boolean` | no | — | DataZoom slider below the plot — a Brush whose body also pans the window. |
| `zoom` | `boolean` | no | — | In-plot wheel/drag/keyboard zoom-pan (+/-/0) over the candle index window. |
| `syncId` | `string` | no | — | Connect charts sharing this id — they mirror the zoom window. |
| `tooltipMode` | `'item' \| 'axis'` | no | `item` | item (nearest candle) or axis (crosshair + OHLC at the hovered x). |

## Examples

### OHLC price series

```tsx
import { Candlestick } from '@cascivo/charts'

<Candlestick
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

_Generated from registry v0.8.0 on 2026-07-21. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
