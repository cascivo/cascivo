# Cookbook: Bridge `@cascivo/charts` onto a consumer palette (LifeOS recipe)

> **Goal:** Make `@cascivo/charts` (`PieChart`, `BarChart`, …) draw with a consumer app's own
> semantic colors — `--los-*` in LifeOS' case — without editing any chart source. Themes override
> the **semantic** token layer only; charts read a small set of CSS custom properties, so a handful
> of `var()` remaps in your own `cascivo.css` is the whole bridge.

---

## TL;DR

Charts consume exactly three families of tokens:

| Token                       | Drives                                  |
| --------------------------- | --------------------------------------- |
| `--cascivo-chart-1` … `-8`  | the categorical series/slice palette    |
| `--cascivo-chart-grid`      | grid lines (`GridLines`)                |
| `--cascivo-chart-axis`      | axis lines + tick labels (`Axis`)       |

Map them onto your palette on the container that wraps the charts:

```css
/* cascivo.css — loaded by the consumer app */
.los-charts {
  /* Semantic status palette → the positional chart slots. */
  --cascivo-chart-1: var(--los-accent);
  --cascivo-chart-2: var(--los-success);
  --cascivo-chart-3: var(--los-warning);
  --cascivo-chart-4: var(--los-danger);
  --cascivo-chart-5: var(--los-info);
  --cascivo-chart-6: var(--los-muted);
  --cascivo-chart-7: var(--los-accent-2);
  --cascivo-chart-8: var(--los-neutral);

  /* Grid + axis chrome → the app's border/muted tokens. */
  --cascivo-chart-grid: var(--los-border);
  --cascivo-chart-axis: var(--los-muted);
}
```

```tsx
<div className="los-charts">
  <BarChart mode="stacked" {...toStackedSeries(rows)} title="Throughput" />
</div>
```

Because these are CSS custom properties, the mapping cascades to every chart inside the wrapper —
including `plain` and tiny embedded charts, where `--cascivo-chart-grid`/`-axis` are still honored.

---

## 1. Why this is just token remapping

Cascivo's tokens are layered **primitive → semantic → component**. Themes (`data-theme`) override the
semantic layer; charts read component-level `--cascivo-chart-*`. You're not theming the whole design
system here — only pointing the chart tokens at colors you already maintain. Scope it to a wrapper
class (or any element) so it doesn't leak into the rest of the page.

## 2. Per-datum / per-series color — the precise override

The palette remap above handles the *positional* colors. When a specific slice or layer must be a
particular **semantic** color regardless of position (backlog vs in-progress vs done), set `color`
directly on the datum/series — it beats the palette:

```tsx
// Pie: per-slice color
<PieChart
  data={[
    { id: 'done', label: 'Done', value: 92, color: 'var(--los-success)' },
    { id: 'wip', label: 'In progress', value: 34, color: 'var(--los-warning)' },
    { id: 'blocked', label: 'Blocked', value: 16, color: 'var(--los-danger)' },
  ]}
  title="Status"
/>

// Stacked bar: per-layer color (preserved by toStackedSeries)
const rows = [{ label: 'Mon', segments: [
  { key: 'Done', value: 5, color: 'var(--los-success)' },
  { key: 'Blocked', value: 2, color: 'var(--los-danger)' },
] }]
<BarChart mode="stacked" {...toStackedSeries(rows)} title="Throughput" />
```

Use the **palette remap** when positional rotation is fine and you just want your brand colors; use
the **`color` override** when the color must carry meaning. See the
[stacked-bar cookbook](./charts-stacked-bar.md) for the `toStackedSeries` helper.

## 3. Scope and dark mode

Apply the bridge class on a container that also carries your `data-theme`, so the chart tokens track
light/dark with the rest of the app:

```html
<main data-theme="dark" class="los-charts">…charts…</main>
```

Nothing in the charts hard-codes a color — every fill resolves through these `var()`s — so a single
`cascivo.css` is the entire integration.
