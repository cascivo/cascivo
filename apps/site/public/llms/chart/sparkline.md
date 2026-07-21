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

| Prop     | Type       | Required | Default | Description                 |
| -------- | ---------- | -------- | ------- | --------------------------- |
| `data`   | `number[]` | yes      | —       | Array of numeric values     |
| `label`  | `string`   | yes      | —       | Accessible label            |
| `width`  | `number`   | no       | `80`    | Width of the component.     |
| `height` | `number`   | no       | `32`    | Height of the component.    |
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

---

_Generated from registry v0.9.0 on 2026-07-21. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
