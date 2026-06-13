# Meter

Progress meter in bar or gauge variant with threshold coloring.

## Install

```bash
npx cascade add chart/meter
```

## Category

`chart`

## Variants

- `bar`
- `gauge`

## Props

| Prop         | Type              | Required | Default | Description       |
| ------------ | ----------------- | -------- | ------- | ----------------- | --- |
| `value`      | `number`          | yes      | —       | Current value     |
| `label`      | `string`          | yes      | —       | —                 |
| `min`        | `number`          | no       | `0`     | —                 |
| `max`        | `number`          | no       | `100`   | —                 |
| `variant`    | `'bar'            | 'gauge'` | no      | `bar`             | —   |
| `thresholds` | `MeterThresholds` | no       | —       | Color breakpoints |
| `width`      | `number`          | no       | —       | —                 |
| `height`     | `number`          | no       | —       | —                 |

## Examples

### Basic meter

```tsx
import { Meter } from '@cascade-ui/charts'
;<Meter value={72} label="CPU usage" />
```

## Design tokens

- `--cascivo-chart-1`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `meter`

## Dependencies

- `@cascade-ui/charts`

## Tags

chart, meter, gauge, progress, data-viz
