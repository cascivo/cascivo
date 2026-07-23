# Gauge

A speedometer gauge — a value arc over a min–max sweep with threshold zones, ticks, and a needle.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { Gauge } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // required — without it the screen-reader data-table fallback renders visibly
```

## Category

`chart`

## Props

| Prop          | Type                                | Required | Default | Description                                                |
| ------------- | ----------------------------------- | -------- | ------- | ---------------------------------------------------------- |
| `value`       | `number`                            | yes      | —       | The value the needle points to.                            |
| `min`         | `number`                            | no       | `0`     | Minimum allowed value.                                     |
| `max`         | `number`                            | no       | `100`   | Maximum allowed value.                                     |
| `thresholds`  | `{ upTo: number; color: string }[]` | no       | —       | Coloured zones from min upward; the last should reach max. |
| `unit`        | `string`                            | no       | —       | Suffix after the centre value.                             |
| `sweep`       | `number`                            | no       | `270`   | Total sweep angle in degrees (270 = a speedometer arc).    |
| `ticks`       | `number`                            | no       | `5`     | Major tick count.                                          |
| `title`       | `string`                            | yes      | —       | Chart title (also aria-label).                             |
| `description` | `string`                            | no       | —       | Supporting description text.                               |
| `width`       | `number`                            | no       | —       | Width of the component.                                    |
| `height`      | `number`                            | no       | `240`   | Height of the component.                                   |
| `className`   | `string`                            | no       | —       | Additional CSS class names merged onto the root element.   |
| `plain`       | `boolean`                           | no       | `false` | Marks only — no ticks/labels. For micro/inline charts.     |

## Examples

### Speedometer with zones

```tsx
import { Gauge } from '@cascivo/charts'
;<Gauge
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

_Generated from registry v0.10.1 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
