# FlowCanvas

The pan/zoom canvas pane — a single CSS-transformed layer driven by the viewport signal.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add flow/flow-canvas
```

_Copy-paste only — this block/layout is not published as an importable package._

## Category

`display`

## Props

| Prop               | Type                                     | Required | Default | Description                                              |
| ------------------ | ---------------------------------------- | -------- | ------- | -------------------------------------------------------- |
| `children`         | `ReactNode`                              | no       | —       | Background, nodes, edges.                                |
| `viewport`         | `{ x: number; y: number; zoom: number }` | no       | —       | Controlled viewport.                                     |
| `onViewportChange` | `(viewport: Viewport) => void`           | no       | —       | Viewport change callback.                                |
| `minZoom`          | `number`                                 | no       | `0.2`   | —                                                        |
| `maxZoom`          | `number`                                 | no       | `2`     | —                                                        |
| `panOnDrag`        | `boolean`                                | no       | `true`  | —                                                        |
| `zoomOnScroll`     | `boolean`                                | no       | `true`  | —                                                        |
| `fitView`          | `boolean`                                | no       | `false` | —                                                        |
| `className`        | `string`                                 | no       | —       | Additional CSS class names merged onto the root element. |

## Examples

### Empty canvas with a background

```tsx
;() => (
  <FlowCanvas style={{ height: 240 }}>
    <FlowBackground />
  </FlowCanvas>
)
```

## Design tokens

- `--cascivo-color-bg`
- `--cascivo-radius-surface`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `application`
- **Keyboard:** Tab (focus), Drag (pan), Wheel (zoom)

## Dependencies

- `@cascivo/core`

## Tags

flow, canvas, viewport, pan, zoom
