# FlowMiniMap

A scaled SVG overview of the graph with a draggable viewport rectangle.

## Install

Ships in the `@cascivo/flow` package — install it (no copy-paste):

```sh
pnpm add @cascivo/flow
```

```tsx
import { FlowMiniMap } from '@cascivo/flow'
import '@cascivo/flow/styles.css' // required stylesheet
```

## Category

`display`

## Props

| Prop               | Type                                                           | Required | Default        | Description                                               |
| ------------------ | -------------------------------------------------------------- | -------- | -------------- | --------------------------------------------------------- |
| `nodes`            | `FlowNode[]`                                                   | yes      | —              | The nodes to render.                                      |
| `viewport`         | `Viewport`                                                     | yes      | —              | The current pan/zoom viewport to reflect in the minimap.  |
| `containerWidth`   | `number`                                                       | no       | —              | Width of the flow container, used to scale the minimap.   |
| `containerHeight`  | `number`                                                       | no       | —              | Height of the flow container, used to scale the minimap.  |
| `width`            | `number`                                                       | no       | `200`          | Width of the component.                                   |
| `height`           | `number`                                                       | no       | `150`          | Height of the component.                                  |
| `position`         | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | no       | `bottom-right` | Position of the component.                                |
| `onViewportChange` | `(viewport: Viewport) => void`                                 | no       | —              | Called with the new viewport when the minimap is dragged. |
| `className`        | `string`                                                       | no       | —              | Additional CSS class names merged onto the root element.  |

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

_Generated from registry v0.11.0 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
