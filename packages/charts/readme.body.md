Accessible, signal-driven chart library for cascivo — AreaChart, BarChart, LineChart, Sparkline, Heatmap, and more. All charts are keyboard-navigable with `aria-live` tooltips. CVD-safe palettes (Okabe-Ito, oklch) verified in CI across all {{count.themes}} themes.

> **Docs offline?** The full cascivo reference ships as an npm package — `npx -y @cascivo/docs`, no website needed.

## Install

```sh
pnpm add @cascivo/charts @preact/signals-react
```

`react`, `react-dom`, and `@preact/signals-react` are peer dependencies — install them in your app.

## Usage

```tsx
import { AreaChart, BarChart, LineChart, Sparkline } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // required — maps to the dist `charts.css`
import '@cascivo/themes/dark.css' // any cascivo theme drives the chart colors

export function Traffic() {
  return (
    <LineChart
      data={[
        { x: 0, y: 12 },
        { x: 1, y: 28 },
        { x: 2, y: 19 },
      ]}
    />
  )
}
```

Charts are CSS-token-themed: drop them inside any element carrying a `data-theme` (or import a
theme stylesheet) and they pick up the same palette, radii, and typography as the rest of cascivo.

### Sizing — responsive by default

**Omit `width`** and the chart fills and tracks its container (a `ResizeObserver`
watches the slot), so a chart drops cleanly into a responsive `Card` or grid cell with
no measuring on your part. `height` defaults to `300` (px); set it to change the aspect.

Pass an explicit `width` only for a fixed-size export — and even then it is **clamped to
the container** (`max-inline-size: 100%`), so an over-wide `width` scales down instead of
overflowing and clipping data. To size another element to match a chart, or to build a
custom chart, use the exported `useChartSize()` hook.

```tsx
<Card>
  <LineChart data={data} />           {/* fills the card, resizes with it */}
</Card>
<LineChart data={data} height={160} /> {/* shorter, still full-width */}
```

> **Vite SSR (TanStack Start, Remix, vite-ssr, workerd)?** Like the rest of cascivo, the
> chart CSS ships as side-effect imports a bare server loader can't resolve — mark
> `ssr: { noExternal: [/^@cascivo\//] }` (the pattern already covers `@cascivo/charts`) and
> import `@cascivo/charts/styles.css` once in your root entry. Full recipe:
> [USING-WITH-VITE-SSR.md](https://github.com/cascivo/cascivo/blob/main/docs/USING-WITH-VITE-SSR.md).

### React apps must subscribe to signals

The charts are signal-driven. In a plain React app (no Babel signals transform), call `useSignals()`
from `@cascivo/core` as the first statement of any component that reads a signal during render. The
docs app (Preact) does not need this.

## Coloring

By default every slice/series/layer is colored from the positional palette
(`--cascivo-chart-1` … `--cascivo-chart-8`, theme-driven and CVD-safe). To pin a specific color,
set `color` on the **datum** (`PieChartDatum`) or **series** (`BarChartSeries`) — not on the chart
component. Any CSS color works, including a token:

```tsx
<PieChart
  title="Task status"
  data={[
    { id: 'done', label: 'Done', value: 92, color: 'var(--cascivo-color-success)' },
    { id: 'blocked', label: 'Blocked', value: 16, color: 'var(--cascivo-color-destructive)' },
  ]}
/>
```

Omit `color` and the slice falls back to its positional palette entry.

## Donut with a center label

Pass `donut`, then `centerValue`/`centerLabel` (or arbitrary `centerSlot` content) to fill the hole.
`thickness` (ring width, px) or `innerRadius` (px, wins over `thickness`) tune the ring; `size` is a
square width/height shorthand:

```tsx
<PieChart
  donut
  size={220}
  thickness={28}
  centerValue="142"
  centerLabel="Total tasks"
  title="Task status"
  data={data}
/>
```

Empty `data` renders a visible placeholder ("No data", override with `emptyLabel`).

## Stacked bars from row data

`toStackedSeries(rows)` pivots row-oriented `{ label, segments: [{ key, value, color? }] }` data into
the `series` + `x`/`y` shape `BarChart` consumes, preserving per-segment color. Spread the result in:

```tsx
import { BarChart, toStackedSeries } from '@cascivo/charts'

const rows = [
  { label: 'Mon', segments: [
    { key: 'Done', value: 5, color: 'var(--cascivo-color-success)' },
    { key: 'Blocked', value: 2, color: 'var(--cascivo-color-destructive)' },
  ] },
  { label: 'Tue', segments: [
    { key: 'Done', value: 8, color: 'var(--cascivo-color-success)' },
    { key: 'Blocked', value: 1, color: 'var(--cascivo-color-destructive)' },
  ] },
]

<BarChart mode="stacked" tooltip {...toStackedSeries(rows)} title="Throughput" />
```

The stacked tooltip lists `label · total` then each non-zero layer in its color; pass `tooltipFormat`
to override, or `xLabelEvery={n}` to thin a crowded x-axis.
