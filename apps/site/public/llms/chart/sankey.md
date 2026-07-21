# Sankey

Flow diagram — ranked nodes connected by throughput-sized link ribbons.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { Sankey } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // required — without it the screen-reader data-table fallback renders visibly
```

## Category

`chart`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `nodes` | `SankeyNode[]` | yes | — | Nodes: { id, label, color? }. |
| `links` | `SankeyLink[]` | yes | — | Links: { source, target, value }. |
| `title` | `string` | yes | — | Title text for the component. |
| `description` | `string` | no | — | Supporting description text. |
| `width` | `number` | no | — | Width of the component. |
| `height` | `number` | no | `320` | Height of the component. |
| `tooltip` | `boolean` | no | — | Whether to show tooltips on hover. |
| `className` | `string` | no | — | Additional CSS class names merged onto the root element. |
| `plain` | `boolean` | no | `false` | When true, renders a minimal variant without chart chrome. |

## Examples

### Sankey flow

```tsx
import { Sankey } from '@cascivo/charts'

<Sankey
  title="Traffic flow"
  nodes={[{ id: 'a', label: 'Search' }, { id: 'b', label: 'Home' }, { id: 'c', label: 'Signup' }]}
  links={[{ source: 'a', target: 'b', value: 30 }, { source: 'b', target: 'c', value: 12 }]}
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
- **Keyboard:** Tab (focus chart), ArrowLeft/ArrowRight (navigate nodes), Escape (clear focus)

## Dependencies

- `@cascivo/charts`

## Tags

chart, sankey, flow, network, data-viz

---

_Generated from registry v0.8.0 on 2026-07-21. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
