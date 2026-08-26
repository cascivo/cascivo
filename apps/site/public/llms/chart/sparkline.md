# Sparkline

Compact inline sparkline for embedding trend data in dashboards or KPI cards.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { Sparkline } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // bundler: automatic. Needed only for no-bundler / SSR-externalised builds, where skipping it renders the screen-reader data-table fallback visibly
```

## Category

`chart`

## Props

| Prop        | Type       | Required | Default                    | Description                                                                                                                                                                                                                                                                                                                          |
| ----------- | ---------- | -------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `data`      | `number[]` | yes      | —                          | Array of numeric values                                                                                                                                                                                                                                                                                                              |
| `label`     | `string`   | no       | —                          | Accessible name for the chart (invisible — rendered as the SVG `<title>`). Not rendered — screen readers only.                                                                                                                                                                                                                       |
| `ariaLabel` | `string`   | no       | —                          | Alias for `label` (the catalog convention for an invisible accessible name). Both work; pass exactly one. Not rendered — screen readers only.                                                                                                                                                                                        |
| `width`     | `number`   | no       | `120`                      | SVG width in px. **This chart is fixed-width by default** — it is a compact, inline chart meant to sit in a table cell or beside a label, so omitting `width` gives you 120px rather than a container-filling chart. Pass a number to change it. The catalogue-wide "omit for a responsive chart" note does not apply to this chart. |
| `height`    | `number`   | no       | `32`                       | SVG height in px. Unlike `width`, height does NOT track the container — this is the knob you set to change the chart's aspect.                                                                                                                                                                                                       |
| `color`     | `string`   | no       | `'var(--cascivo-chart-1)'` | Stroke color (CSS value)                                                                                                                                                                                                                                                                                                             |
| `endDot`    | `boolean`  | no       | `true`                     | Show dot at last data point                                                                                                                                                                                                                                                                                                          |

## Examples

### Inline sparkline

```tsx
import { Sparkline } from '@cascivo/charts'
;<Sparkline data={[10, 20, 15, 30, 25]} label="Trend" endDot />
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

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

_Generated from registry v1.0.0 on 2026-08-26. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
