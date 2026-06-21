# Sparkline

Compact inline sparkline for embedding trend data in dashboards or KPI cards.

## Install

Charts ship in the `@cascivo/charts` package:

```sh
pnpm add @cascivo/charts
```

```tsx
import { Sparkline } from '@cascivo/charts'
```

## Category

`chart`

## Props

| Prop     | Type       | Required | Default | Description                 |
| -------- | ---------- | -------- | ------- | --------------------------- |
| `data`   | `number[]` | yes      | —       | Array of numeric values     |
| `label`  | `string`   | yes      | —       | Accessible label            |
| `width`  | `number`   | no       | `80`    | —                           |
| `height` | `number`   | no       | `32`    | —                           |
| `color`  | `string`   | no       | —       | Stroke color (CSS value)    |
| `endDot` | `boolean`  | no       | —       | Show dot at last data point |

## Examples

### Inline sparkline

```tsx
import { Sparkline } from '@cascivo/charts'
;<Sparkline data={[10, 20, 15, 30, 25]} label="Trend" endDot />
```

## Design tokens

- `--cascivo-chart-1`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `img`

## Dependencies

- `@cascivo/charts`

## Tags

chart, sparkline, inline, trend, data-viz
