# FlowMiniMap

A scaled SVG overview of the graph with a draggable viewport rectangle.

## Install

Ships in the `@cascivo/flow` package — install it (no copy-paste):

```sh
pnpm add @cascivo/flow
```

```tsx
import { FlowMiniMap } from '@cascivo/flow'
import '@cascivo/flow/styles.css' // bundler: automatic. Needed only for no-bundler / SSR-externalised builds
```

## Category

`display`

## Props

| Prop               | Type                                                           | Required | Default        | Description                                                                                                                                  |
| ------------------ | -------------------------------------------------------------- | -------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `nodes`            | `FlowNode[]`                                                   | yes      | —              | The nodes to render.                                                                                                                         |
| `viewport`         | `Viewport`                                                     | yes      | —              | The current pan/zoom viewport to reflect in the minimap.                                                                                     |
| `containerWidth`   | `number`                                                       | no       | —              | Width of the flow container, used to scale the minimap.                                                                                      |
| `containerHeight`  | `number`                                                       | no       | —              | Height of the flow container, used to scale the minimap.                                                                                     |
| `width`            | `number`                                                       | no       | `200`          | Width in px.                                                                                                                                 |
| `height`           | `number`                                                       | no       | `150`          | Height in px.                                                                                                                                |
| `position`         | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | no       | `bottom-right` | Canvas corner the minimap is pinned to: `bottom-right`, `bottom-left`, `top-left` or `top-right`.                                            |
| `onViewportChange` | `(viewport: Viewport) => void`                                 | no       | —              | Called with the new viewport when the minimap is dragged.                                                                                    |
| `className`        | `string`                                                       | no       | —              | Additional CSS class names merged onto the root element.                                                                                     |
| `ariaLabel`        | `string`                                                       | no       | —              | Alias of `label` — the same invisible accessible name under the catalog spelling. Neither is deprecated. Not rendered — screen readers only. |
| `label`            | `string \| undefined`                                          | no       | —              | Accessible name for the minimap region. Not rendered — screen readers only.                                                                  |
| `nodeColor`        | `string \| undefined`                                          | no       | —              | Fill colour for node rectangles in the minimap.                                                                                              |

## Object types

### `FlowNode`

A graph node.

| Field      | Type         | Required | Description                                                      |
| ---------- | ------------ | -------- | ---------------------------------------------------------------- |
| `id`       | `string`     | yes      | —                                                                |
| `position` | `XYPosition` | yes      | —                                                                |
| `data`     | `Data`       | no       | —                                                                |
| `type`     | `string`     | no       | Custom renderer key resolved via `nodeTypes`.                    |
| `selected` | `boolean`    | no       | —                                                                |
| `width`    | `number`     | no       | Explicit/measured size used for handle anchors + bounding boxes. |
| `height`   | `number`     | no       | —                                                                |

### `Viewport`

The pan/zoom state of the canvas pane.

| Field  | Type     | Required | Description |
| ------ | -------- | -------- | ----------- |
| `x`    | `number` | yes      | —           |
| `y`    | `number` | yes      | —           |
| `zoom` | `number` | yes      | —           |

## Examples

### Graph overview

```tsx
;() => (
  <FlowMiniMap
    nodes={[
      { id: 'a', position: { x: 0, y: 0 } },
      { id: 'b', position: { x: 220, y: 120 } },
      { id: 'c', position: { x: 440, y: 0 } },
    ]}
    viewport={{ x: 0, y: 0, zoom: 1 }}
    containerWidth={400}
    containerHeight={300}
  />
)
```

## Client JavaScript

Required. The component's primary job needs client JavaScript, so do not render it from a Server Component without hydrating — even if some or all of its markup appears in the server HTML.

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border-strong`
- `--cascivo-color-accent`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `img`

## Dependencies

- `@cascivo/core`

## Tags

flow, minimap, overview, chrome

---

_Generated from registry v0.18.0 on 2026-08-17. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
