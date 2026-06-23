# FlowMiniMap

A scaled SVG overview of the graph with a draggable viewport rectangle.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add flow/flow-minimap
```

_Copy-paste only — this block/layout is not published as an importable package._

## Category

`display`

## Props

| Prop               | Type                           | Required    | Default       | Description     |
| ------------------ | ------------------------------ | ----------- | ------------- | --------------- | --- | -------------- | --- |
| `nodes`            | `FlowNode[]`                   | yes         | —             | —               |
| `viewport`         | `Viewport`                     | yes         | —             | —               |
| `containerWidth`   | `number`                       | no          | —             | —               |
| `containerHeight`  | `number`                       | no          | —             | —               |
| `width`            | `number`                       | no          | `200`         | —               |
| `height`           | `number`                       | no          | `150`         | —               |
| `position`         | `'top-left'                    | 'top-right' | 'bottom-left' | 'bottom-right'` | no  | `bottom-right` | —   |
| `onViewportChange` | `(viewport: Viewport) => void` | no          | —             | —               |
| `className`        | `string`                       | no          | —             | —               |

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
