# Funnel

Vertical conversion funnel — each stage is a trapezoid narrowing toward the next, with optional conversion labels.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { Funnel } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // bundler: automatic. Needed only for no-bundler / SSR-externalised builds, where skipping it renders the screen-reader data-table fallback visibly
```

## Category

`chart`

## Props

| Prop             | Type            | Required | Default | Description                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------- | --------------- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`           | `FunnelStage[]` | yes      | —       | Ordered stages (descending): { id, label, value, color? }.                                                                                                                                                                                                                                                                                                                                    |
| `title`          | `string`        | yes      | —       | Chart title (also used as aria-label).                                                                                                                                                                                                                                                                                                                                                        |
| `description`    | `string`        | no       | —       | Subtitle below the title.                                                                                                                                                                                                                                                                                                                                                                     |
| `width`          | `number`        | no       | —       | Fixed SVG width in px. ⚠ **Omit for a responsive chart** — the chart fills and tracks its container via a ResizeObserver; there is no correct pixel number in a responsive grid. A fixed width is clamped to the container (max-inline-size: 100%) so it can never overflow its card, but it also stops the chart growing. `useChartSize` is NOT needed for this — charts call it internally. |
| `height`         | `number`        | no       | `320`   | SVG height in px. Unlike `width`, height does NOT track the container — this is the knob you set to change the chart's aspect.                                                                                                                                                                                                                                                                |
| `showConversion` | `boolean`       | no       | `false` | Append each stage’s % of the first stage to its label.                                                                                                                                                                                                                                                                                                                                        |
| `tooltip`        | `boolean`       | no       | —       | Enable hover tooltip.                                                                                                                                                                                                                                                                                                                                                                         |
| `className`      | `string`        | no       | —       | Additional CSS class names merged onto the root element.                                                                                                                                                                                                                                                                                                                                      |
| `plain`          | `boolean`       | no       | `false` | Marks only — no labels. For micro/inline charts.                                                                                                                                                                                                                                                                                                                                              |

## Object types

### `FunnelStage`

Shape of the `data` prop.

| Field   | Type     | Required | Description                                                 |
| ------- | -------- | -------- | ----------------------------------------------------------- |
| `id`    | `string` | yes      | —                                                           |
| `label` | `string` | yes      | —                                                           |
| `value` | `number` | yes      | —                                                           |
| `color` | `string` | no       | CSS color overriding the positional palette for this stage. |

## Examples

### Signup conversion funnel

```tsx
import { Funnel } from '@cascivo/charts'
;<Funnel
  title="Signup funnel"
  showConversion
  data={[
    { id: 'visit', label: 'Visited', value: 8200 },
    { id: 'signup', label: 'Signed up', value: 3100 },
    { id: 'active', label: 'Activated', value: 1400 },
    { id: 'paid', label: 'Paid', value: 520 },
  ]}
/>
```

## Design tokens

- `--cascivo-chart-1`
- `--cascivo-chart-2`
- `--cascivo-chart-3`
- `--cascivo-chart-4`
- `--cascivo-chart-5`
- `--cascivo-chart-6`
- `--cascivo-chart-7`
- `--cascivo-chart-8`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `img`
- **Keyboard:** Tab (focus chart), ArrowLeft/ArrowRight (navigate stages), Escape (clear focus)

## Dependencies

- `@cascivo/charts`

## Tags

chart, funnel, conversion, flow, data-viz

---

_Generated from registry v0.17.1 on 2026-08-11. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
