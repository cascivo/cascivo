# Sparkline

Compact inline sparkline for embedding trend data in dashboards or KPI cards.

## Install

```bash
npx cascade add chart/sparkline
```

## Category

`chart`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | `number[]` | yes | — | Array of numeric values |
| `label` | `string` | yes | — | Accessible label |
| `width` | `number` | no | `80` | — |
| `height` | `number` | no | `32` | — |
| `color` | `string` | no | — | Stroke color (CSS value) |
| `endDot` | `boolean` | no | — | Show dot at last data point |

## Examples

### Inline sparkline

```tsx
import { Sparkline } from '@cascade-ui/charts'

<Sparkline data={[10, 20, 15, 30, 25]} label="Trend" endDot />
```

## Design tokens

- `--cascade-chart-1`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `img`

## Dependencies

- `@cascade-ui/charts`

## Tags

chart, sparkline, inline, trend, data-viz
