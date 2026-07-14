# cascivo charts vs Chart.js vs Apache ECharts

An honest comparison of `@cascivo/charts` against the two engines teams reach for on dashboards and
big-data views. cascivo leads on **accessibility, bundle/zero-deps, and owned (copy-paste) code**;
ECharts leads on **breadth (3D/geo/network/streaming)**; Chart.js leads on **tiny-bundle simplicity**.

## Feature matrix

| Dimension | cascivo | Chart.js | Apache ECharts |
| --- | --- | --- | --- |
| Accessibility (keyboard nav, `aria-live`, fallback `<table>` on every chart) | ✅ first-class | ⚠️ minimal | ⚠️ decal + some `aria` |
| CVD-safe palettes **and** patterns | ✅ built-in | ❌ | ⚠️ decals |
| Bundle / dependencies | ✅ zero runtime deps | ⚠️ ~200 KB + date adapter | ❌ ~1 MB |
| Renderer | ✅ SVG + opt-in Canvas | Canvas | Canvas + SVG |
| Owned code (copy-paste, no lock-in) | ✅ shadcn-model | ❌ npm only | ❌ npm only |
| Chart-type count | ~25 | ~8 | ~15 + custom |
| dataZoom / zoom-pan / chart connect | ✅ (v53) | ⚠️ zoom plugin | ✅ |
| visualMap (data→colour/size) | ✅ (v53) | ❌ | ✅ |
| dataset / transform / encode pipeline | ✅ (v53) | ❌ | ✅ |
| Axis crosshair + shared tooltip | ✅ (v53) | ⚠️ tooltip modes | ✅ |
| Decimation (LTTB / min-max) | ✅ (v53) | ✅ LTTB | ✅ progressive |
| Toolbox (export PNG/SVG, data view, restore) | ✅ (v53) | ❌ | ✅ |
| Configurable animation | ✅ CSS, reduced-motion-gated (v53) | ✅ rich JS | ✅ rich JS |
| Extension seam | ✅ `onBeforeDraw`/`onAfterDraw` | ✅ plugins | ✅ custom series |
| 3D / GL | ❌ out of scope | ❌ | ✅ echarts-gl |
| Geo / maps | ❌ out of scope | ⚠️ plugin | ✅ |
| Force / network graphs | ❌ out of scope | ❌ | ✅ |

**Reading it:** pick **cascivo** when accessibility, theming, bundle size, and owning the source matter
(design systems, a11y-regulated products, dashboards that must stay light). Pick **ECharts** when you
need geo/3D/network/streaming breadth and can afford ~1 MB. Pick **Chart.js** for a quick, tiny,
canvas chart with minimal interaction.

If you adopt Chart.js or ECharts anyway, tame the global CSS they ship so it can't beat your
cascivo layers — import it into a low-priority `vendor` layer per
[THIRD-PARTY-CSS.md](./THIRD-PARTY-CSS.md).

## Recipe gallery

Every recipe below uses deterministic data and the public `@cascivo/charts` API. Each maps to a v53
feature.

### dataZoom slider + inside zoom-pan

```tsx
<LineChart series={series} x={(d) => d.t} y={(d) => d.v} title="Traffic" dataZoom zoom />
```

`dataZoom` renders a draggable/pannable slider under the plot; `zoom` adds wheel/drag/keyboard
(`+`/`-`/`0`) zoom-pan in the plot with a reset; axes re-tick to the visible window.

### Connected charts (shared zoom + hover)

```tsx
<LineChart series={a} x={x} y={y} title="CPU" zoom syncId="host-1" />
<LineChart series={b} x={x} y={y} title="Memory" zoom syncId="host-1" />
```

Charts sharing a `syncId` mirror each other's zoom window via `core/sync.ts`.

### visualMap heatmap (data → CVD-safe colour)

```tsx
<Heatmap data={grid} title="Activity" visualMap={{ min: 0, max: 100, ramp: 'sequential' }} />
```

The legend's thumbs filter the visible range; the ramp is colour-vision-safe by construction
(`engine/ramp.ts`, interpolated in oklch). Piecewise + a `size` channel (scatter) are supported too.

### transform + encode (data pipeline)

```tsx
import { aggregate, encode } from '@cascivo/charts'

const totals = aggregate(rows, { groupBy: 'team', ops: { sales: 'sum' } })
<BarChart {...encode(totals, { x: 'team', y: 'sales' })} title="Sales by team" />
```

Pure, composable pre-processors (`filter`/`sort`/`aggregate`/`bin`/`regression` + `encode`); the
component contract is unchanged.

### Axis crosshair + shared tooltip

```tsx
<LineChart series={multi} x={x} y={y} title="Metrics" tooltip tooltipMode="axis" />
```

Draws a vertical crosshair and one tooltip listing every series at the hovered x; the `aria-live`
readout and keyboard Arrow traversal follow the x.

### Decimated large series

```tsx
<LineChart series={[{ id: 'big', label: 'Sensor', data: hundredK }]}
  x={x} y={y} title="Sensor" decimate={{ method: 'lttb', threshold: 2000 }} />
```

LTTB/min-max downsampling keeps the curve crisp and fast; the fallback `<table>` keeps the **full**
data (a11y unaffected).

### Toolbox export / data view / restore

```tsx
<AreaChart series={series} x={x} y={y} title="Revenue" zoom toolbox />
```

A keyboard-reachable cluster: export a standalone SVG (tokens inlined) or a `devicePixelRatio` PNG,
toggle a readable data-view `<table>`, and restore the default view.

### Candlestick (OHLC)

```tsx
<Candlestick data={ohlc} title="ACME daily" tooltip volume />
```

### Polar rose

```tsx
<Polar data={byDirection} title="Wind" mode="bar" tooltip />
```

### Gauge (speedometer)

```tsx
<Gauge title="CPU" value={72} unit="%" thresholds={[
  { upTo: 50, color: 'var(--cascivo-chart-2)' },
  { upTo: 80, color: 'var(--cascivo-chart-3)' },
  { upTo: 100, color: 'var(--cascivo-chart-4)' },
]} />
```

### Configurable animation + extension seam

```tsx
<LineChart series={series} x={x} y={y} title="Animated"
  transition={{ duration: 600, easing: 'ease-in-out' }}
  onAfterDraw={({ width }) => <text x={width - 8} y={16} textAnchor="end">DRAFT</text>} />
```

`transition` tunes the (reduced-motion-gated) enter/update animations; `onBeforeDraw`/`onAfterDraw`
inject custom SVG behind/over the marks — cascivo's owned-code answer to Chart.js plugins.
