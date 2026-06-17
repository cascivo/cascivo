# Bullet

Bullet chart with background range bands, measure bar, and target tick.

## Install

```bash
npx cascivo add chart/bullet
```

## Category

`chart`

## Props

| Prop        | Type       | Required | Default | Description                                      |
| ----------- | ---------- | -------- | ------- | ------------------------------------------------ |
| `value`     | `number`   | yes      | —       | Current measure value                            |
| `target`    | `number`   | yes      | —       | Target marker value                              |
| `ranges`    | `number[]` | yes      | —       | Qualitative range breakpoints (sorted ascending) |
| `label`     | `string`   | yes      | —       | —                                                |
| `min`       | `number`   | no       | `0`     | —                                                |
| `max`       | `number`   | no       | —       | Domain maximum (defaults to last range)          |
| `width`     | `number`   | no       | `300`   | —                                                |
| `height`    | `number`   | no       | `40`    | —                                                |
| `className` | `string`   | no       | —       | —                                                |

## Examples

### Basic bullet chart

```tsx
import { Bullet } from '@cascivo/charts'
;<Bullet value={72} target={80} ranges={[40, 70, 100]} label="Revenue %" />
```

## Design tokens

- `--cascivo-chart-1`
- `--cascivo-color-neutral-200`
- `--cascivo-color-neutral-300`
- `--cascivo-color-neutral-400`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `img`

## Dependencies

- `@cascivo/charts`

## Tags

chart, bullet, kpi, progress, data-viz
