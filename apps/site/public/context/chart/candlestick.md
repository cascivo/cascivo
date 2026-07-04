# Candlestick

**Category:** chart  
**Description:** OHLC financial chart — each period a high–low wick and an open↔close body, coloured up/down.

## When to use

- Showing open/high/low/close price movement over time
- Financial or trading dashboards needing per-period range + direction

## When NOT to use

- A single value trend — use LineChart
- Non-financial categorical data — use BarChart

## Related components

- **LineChart** (alternative): Use when only the closing price trend matters

## Accessibility rationale

Renders with role="img"; OHLC values are in the fallback table and tooltip.

## Props

| Name          | Type                 | Required | Default | Description                                                                |
| ------------- | -------------------- | -------- | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `data`        | `CandlestickDatum[]` | Yes      | —       | One candle per period: { t, open, high, low, close, volume? }.             |
| `title`       | `string`             | Yes      | —       | Chart title (also aria-label).                                             |
| `description` | `string`             | No       | —       | Supporting description text.                                               |
| `width`       | `number`             | No       | —       | Width of the component.                                                    |
| `height`      | `number`             | No       | 320     | Height of the component.                                                   |
| `yTicks`      | `number`             | No       | 5       | Approximate number of ticks on the y-axis.                                 |
| `upColor`     | `string`             | No       | —       | Colour for up candles (close ≥ open).                                      |
| `downColor`   | `string`             | No       | —       | Colour for down candles (close < open).                                    |
| `volume`      | `boolean`            | No       | false   | Render volume bars beneath the candles.                                    |
| `tooltip`     | `boolean`            | No       | —       | Enable hover tooltip (OHLC).                                               |
| `className`   | `string`             | No       | —       | Additional CSS class names merged onto the root element.                   |
| `plain`       | `boolean`            | No       | false   | Marks only — no axes. For micro/inline charts.                             |
| `annotations` | `Annotation[]`       | No       | —       | Reference lines/bands/markers over the plot (e.g. a last-price rule).      |
| `brush`       | `boolean`            | No       | —       | Keyboard-operable Brush below the plot to subset the candles to a window.  |
| `dataZoom`    | `boolean`            | No       | —       | DataZoom slider below the plot — a Brush whose body also pans the window.  |
| `zoom`        | `boolean`            | No       | —       | In-plot wheel/drag/keyboard zoom-pan (+/-/0) over the candle index window. |
| `syncId`      | `string`             | No       | —       | Connect charts sharing this id — they mirror the zoom window.              |
| `tooltipMode` | `'item'              | 'axis'`  | No      | item                                                                       | item (nearest candle) or axis (crosshair + OHLC at the hovered x). |

## Tokens

- `--cascivo-chart-2`
- `--cascivo-chart-4`
- `--cascivo-chart-grid`

## Examples

### OHLC price series

```jsx
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

```jsx
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

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Candlestick component (chart). OHLC financial chart — each period a high–low wick and an open↔close body, coloured up/down.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Candlestick is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-chart-2, --cascivo-chart-4, --cascivo-chart-grid

Accessibility: role "img", WCAG 2.1-AA, keyboard: Tab (focus chart)/ArrowLeft/ArrowRight (navigate candles)/+/- (zoom), 0 (reset) when zoom enabled/Escape (clear focus). Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
