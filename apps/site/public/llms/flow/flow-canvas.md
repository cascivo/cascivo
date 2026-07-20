# FlowCanvas

The pan/zoom canvas pane — a single CSS-transformed layer driven by the viewport signal.

## Install

Ships in the `@cascivo/flow` package — install it (no copy-paste):

```sh
pnpm add @cascivo/flow
```

```tsx
import { FlowCanvas } from '@cascivo/flow'
import '@cascivo/flow/styles.css' // required stylesheet
```

## Category

`display`

## Props

| Prop               | Type                                     | Required | Default | Description                                              |
| ------------------ | ---------------------------------------- | -------- | ------- | -------------------------------------------------------- |
| `children`         | `ReactNode`                              | no       | —       | Background, nodes, edges.                                |
| `viewport`         | `{ x: number; y: number; zoom: number }` | no       | —       | Controlled viewport.                                     |
| `onViewportChange` | `(viewport: Viewport) => void`           | no       | —       | Viewport change callback.                                |
| `minZoom`          | `number`                                 | no       | `0.2`   | Lower bound for the viewport zoom level.                 |
| `maxZoom`          | `number`                                 | no       | `2`     | Upper bound for the viewport zoom level.                 |
| `panOnDrag`        | `boolean`                                | no       | `true`  | Drag the empty pane to pan the viewport.                 |
| `zoomOnScroll`     | `boolean`                                | no       | `true`  | Wheel or pinch to zoom the viewport.                     |
| `fitView`          | `boolean`                                | no       | `false` | Frame the whole graph once on mount.                     |
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

---

_Generated from registry v0.8.0 on 2026-07-20. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
