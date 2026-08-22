# Gauge

A speedometer gauge — a value arc over a min–max sweep with threshold zones, ticks, and a needle.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { Gauge } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // bundler: automatic. Needed only for no-bundler / SSR-externalised builds, where skipping it renders the screen-reader data-table fallback visibly
```

## Category

`chart`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `number` | yes | — | The value the needle points to. |
| `min` | `number` | no | `0` | Minimum allowed value. |
| `max` | `number` | no | `100` | Maximum allowed value. |
| `thresholds` | `{ upTo: number; color: string }[]` | no | — | Coloured zones from min upward; the last should reach max. |
| `unit` | `string` | no | `''` | Suffix after the centre value. |
| `sweep` | `number` | no | `270` | Total sweep angle in degrees (270 = a speedometer arc). |
| `ticks` | `number` | no | `5` | Major tick count. |
| `title` | `string` | yes | — | Chart title (also aria-label). |
| `description` | `string` | no | — | Supporting description text. |
| `width` | `number` | no | — | Fixed SVG width in px. ⚠ **Omit for a responsive chart** — the chart fills and tracks its container via a ResizeObserver; there is no correct pixel number in a responsive grid. A fixed width is clamped to the container (max-inline-size: 100%) so it can never overflow its card, but it also stops the chart growing. `useChartSize` is NOT needed for this — charts call it internally. |
| `height` | `number` | no | `240` | SVG height in px. Unlike `width`, height does NOT track the container — this is the knob you set to change the chart's aspect. |
| `className` | `string` | no | — | Additional CSS class names merged onto the root element. |
| `plain` | `boolean` | no | `false` | Marks only — no ticks/labels. For micro/inline charts. |

## Object types

### `GaugeThreshold`

Shape of the `thresholds` prop.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `upTo` | `number` | yes | Upper bound of this coloured zone (in value units). |
| `color` | `string` | yes | — |

## Examples

### Speedometer with zones

```tsx
import { Gauge } from '@cascivo/charts'

<Gauge
  title="CPU load"
  value={72}
  unit="%"
  thresholds={[
    { upTo: 50, color: 'var(--cascivo-chart-2)' },
    { upTo: 80, color: 'var(--cascivo-chart-3)' },
    { upTo: 100, color: 'var(--cascivo-chart-4)' },
  ]}
/>
```

## Client JavaScript

Enhancement only. The component still does its job with JavaScript disabled — the server-rendered HTML is correct and nothing is unreachable; client JS adds polish on top.

## Design tokens

- `--cascivo-color-accent`
- `--cascivo-color-foreground`
- `--cascivo-chart-grid`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `img`
- **Keyboard:** Tab (focus chart)

## Dependencies

- `@cascivo/charts`

## Tags

chart, gauge, speedometer, kpi, data-viz

---

_Generated from registry v0.18.0 on 2026-08-17. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
