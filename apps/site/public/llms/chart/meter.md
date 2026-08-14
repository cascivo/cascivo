# Meter

Progress meter in bar or gauge variant with threshold coloring.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { Meter } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // bundler: automatic. Needed only for no-bundler / SSR-externalised builds, where skipping it renders the screen-reader data-table fallback visibly
```

## Category

`chart`

## Variants

- `bar`
- `gauge`

## Props

| Prop         | Type               | Required | Default | Description                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------ | ------------------ | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`      | `number`           | yes      | —       | Current value                                                                                                                                                                                                                                                                                                                                                                                 |
| `label`      | `string`           | yes      | —       | Text label for the control.                                                                                                                                                                                                                                                                                                                                                                   |
| `min`        | `number`           | no       | `0`     | Minimum allowed value.                                                                                                                                                                                                                                                                                                                                                                        |
| `max`        | `number`           | no       | `100`   | Maximum allowed value.                                                                                                                                                                                                                                                                                                                                                                        |
| `variant`    | `'bar' \| 'gauge'` | no       | `bar`   | Selects the visual style variant.                                                                                                                                                                                                                                                                                                                                                             |
| `thresholds` | `MeterThresholds`  | no       | —       | Color breakpoints                                                                                                                                                                                                                                                                                                                                                                             |
| `width`      | `number`           | no       | —       | Fixed SVG width in px. ⚠ **Omit for a responsive chart** — the chart fills and tracks its container via a ResizeObserver; there is no correct pixel number in a responsive grid. A fixed width is clamped to the container (max-inline-size: 100%) so it can never overflow its card, but it also stops the chart growing. `useChartSize` is NOT needed for this — charts call it internally. |
| `height`     | `number`           | no       | —       | SVG height in px. Unlike `width`, height does NOT track the container — this is the knob you set to change the chart's aspect.                                                                                                                                                                                                                                                                |

## Object types

### `MeterThresholds`

Shape of the `thresholds` prop.

| Field      | Type     | Required | Description |
| ---------- | -------- | -------- | ----------- |
| `warning`  | `number` | no       | —           |
| `critical` | `number` | no       | —           |

## Examples

### Basic meter

```tsx
import { Meter } from '@cascivo/charts'
;<Meter value={72} label="CPU usage" />
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Design tokens

- `--cascivo-chart-1`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `meter`

## Dependencies

- `@cascivo/charts`

## Tags

chart, meter, gauge, progress, data-viz

---

_Generated from registry v0.17.1 on 2026-08-11. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
