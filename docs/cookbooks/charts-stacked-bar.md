# Cookbook: Stacked bars from row-oriented data

> **Goal:** Feed `@cascivo/charts`' `BarChart` (`mode="stacked"`) from the row-shaped data
> a `StackedBarChart` usually has — `{ label, segments: [{ key, value, color }] }[]` — without
> hand-rolling the pivot, and get a per-segment tooltip for free.

---

## TL;DR

`BarChart` is column-oriented: it wants one `BarChartSeries` per layer plus `x`/`y` accessors.
Consumer data is usually row-oriented: one entry per bar, each carrying its segments. The pure,
dependency-free `toStackedSeries(rows)` helper pivots the latter into the former and **preserves
each layer's color**. Spread its result straight into the component.

```tsx
import { BarChart, toStackedSeries } from '@cascivo/charts'

const rows = [
  { label: 'Mon', segments: [
    { key: 'Done',    value: 5, color: 'var(--cascivo-color-success)' },
    { key: 'Blocked', value: 2, color: 'var(--cascivo-color-destructive)' },
  ] },
  { label: 'Tue', segments: [
    { key: 'Done',        value: 8, color: 'var(--cascivo-color-success)' },
    { key: 'In progress', value: 3, color: 'var(--cascivo-color-warning)' },
  ] },
]

<BarChart mode="stacked" tooltip {...toStackedSeries(rows)} title="Throughput" />
```

---

## 1. What the helper does

`toStackedSeries(rows)` returns `{ series, x, y }`, spreadable into `<BarChart mode="stacked" />`:

- **One series per layer key**, collected in **first-seen order** across all rows — column order
  is stable regardless of which row a key first appears in.
- **Missing segments become `0`** so stacks stay aligned. A key absent from a row contributes a
  zero-height layer there.
- **Color is preserved per key** — the first non-undefined `color` seen for a key wins (so you can
  set it once on the first row and omit it elsewhere).

It is pure and framework-free — no React, no side effects — so you can also call it in a loader,
a test, or a worker.

```ts
export interface StackedSegment { key: string; value: number; color?: string }
export interface StackedRow { label: string; segments: readonly StackedSegment[] }

function toStackedSeries(rows: readonly StackedRow[]): {
  series: BarChartSeries<{ x: string; y: number }>[]
  x: (d: { x: string; y: number }) => string
  y: (d: { x: string; y: number }) => number
}
```

---

## 2. The per-segment tooltip

With `mode="stacked"` and `tooltip`, the default tooltip shows a **`label · total` header** followed
by each **non-zero** layer's `label: value`, each line tinted in its layer color. The screen-reader
announcement (aria-live) carries the same breakdown as text.

Need a different string? Pass `tooltipFormat`:

```tsx
<BarChart
  mode="stacked"
  tooltip
  tooltipFormat={(p) => `${p.label}: ${p.value} total`}
  {...toStackedSeries(rows)}
  title="Throughput"
/>
```

When you provide `tooltipFormat`, the per-segment breakdown is skipped and your string is used
verbatim (`p.value` is the focused layer's value, `p.label` the category).

---

## 3. The manual pivot (no helper)

If you prefer not to use the helper — e.g. you already have column data, or want a custom merge —
the equivalent pivot is a few lines:

```ts
const keys = [...new Set(rows.flatMap((r) => r.segments.map((s) => s.key)))]

const series = keys.map((key) => ({
  id: key,
  label: key,
  color: rows.flatMap((r) => r.segments).find((s) => s.key === key && s.color)?.color,
  data: rows.map((r) => ({ x: r.label, y: r.segments.find((s) => s.key === key)?.value ?? 0 })),
}))

<BarChart mode="stacked" series={series} x={(d) => d.x} y={(d) => d.y} title="Throughput" />
```

---

## 4. Thinning a crowded x-axis

Categorical (band) axes render **every** category label, including the last. With many bars the
labels crowd. Pass `xLabelEvery` to show every Nth label (the final category is always kept):

```tsx
<BarChart mode="stacked" tooltip xLabelEvery={3} {...toStackedSeries(rows)} title="Daily" />
```

---

## 5. Tiny embedded charts

For micro/inline bars under ~200px, use `plain` (drops axes, grid, legend) with explicit
`width`/`height`:

```tsx
<BarChart mode="stacked" plain width={280} height={140} {...toStackedSeries(rows)} title="Sparkbars" />
```

See also: [LifeOS bridge recipe](./charts-lifeos-bridge.md) for mapping the chart palette tokens
onto a consumer theme.
