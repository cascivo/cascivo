# Sparkline

Compact inline sparkline for embedding trend data in dashboards or KPI cards.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { Sparkline } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // required — without it the screen-reader data-table fallback renders visibly
```

## Category

`chart`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | `number[]` | yes | — | Array of numeric values |
| `label` | `string` | no | — | Accessible name for the chart (invisible — rendered as the SVG `<title>`). |
| `ariaLabel` | `string` | no | — | Alias for `label` (the catalog convention for an invisible accessible name). Both work; pass exactly one. |
| `width` | `number` | no | `80` | Fixed SVG width in px. ⚠ **Omit for a responsive chart** — the chart fills and tracks its container via a ResizeObserver; there is no correct pixel number in a responsive grid. A fixed width is clamped to the container (max-inline-size: 100%) so it can never overflow its card, but it also stops the chart growing. `useChartSize` is NOT needed for this — charts call it internally. |
| `height` | `number` | no | `32` | SVG height in px. Unlike `width`, height does NOT track the container — this is the knob you set to change the chart's aspect. |
| `color` | `string` | no | — | Stroke color (CSS value) |
| `endDot` | `boolean` | no | — | Show dot at last data point |

## Examples

### Inline sparkline

```tsx
import { Sparkline } from '@cascivo/charts'

<Sparkline data={[10, 20, 15, 30, 25]} label="Trend" endDot />
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Design tokens

- `--cascivo-chart-1`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `img`

## Dependencies

- `@cascivo/charts`

## Tags

chart, sparkline, inline, trend, data-viz

---

_Generated from registry v0.16.0 on 2026-08-05. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
