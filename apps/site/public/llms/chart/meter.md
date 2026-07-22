# Meter

Progress meter in bar or gauge variant with threshold coloring.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { Meter } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // required — without it the screen-reader data-table fallback renders visibly
```

## Category

`chart`

## Variants

- `bar`
- `gauge`

## Props

| Prop         | Type               | Required | Default | Description                       |
| ------------ | ------------------ | -------- | ------- | --------------------------------- |
| `value`      | `number`           | yes      | —       | Current value                     |
| `label`      | `string`           | yes      | —       | Text label for the control.       |
| `min`        | `number`           | no       | `0`     | Minimum allowed value.            |
| `max`        | `number`           | no       | `100`   | Maximum allowed value.            |
| `variant`    | `'bar' \| 'gauge'` | no       | `bar`   | Selects the visual style variant. |
| `thresholds` | `MeterThresholds`  | no       | —       | Color breakpoints                 |
| `width`      | `number`           | no       | —       | Width of the component.           |
| `height`     | `number`           | no       | —       | Height of the component.          |

## Examples

### Basic meter

```tsx
import { Meter } from '@cascivo/charts'
;<Meter value={72} label="CPU usage" />
```

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

_Generated from registry v0.10.0 on 2026-07-22. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
