# FlowMiniMap

**Category:** display  
**Description:** A scaled SVG overview of the graph with a draggable viewport rectangle.

## When to use

- Orienting users in a large graph
- Letting users jump around by dragging the view rect

## When NOT to use

- Tiny graphs that fit on screen

## Related components

- **FlowControls** (pairs-with): Complementary navigation chrome.

## Accessibility rationale

role="img" with an i18n-defaulted label describing the overview.

## Props

| Name               | Type                           | Required    | Default       | Description                                               |
| ------------------ | ------------------------------ | ----------- | ------------- | --------------------------------------------------------- | --- | ------------ | -------------------------- |
| `nodes`            | `FlowNode[]`                   | Yes         | —             | The nodes to render.                                      |
| `viewport`         | `Viewport`                     | Yes         | —             | The current pan/zoom viewport to reflect in the minimap.  |
| `containerWidth`   | `number`                       | No          | —             | Width of the flow container, used to scale the minimap.   |
| `containerHeight`  | `number`                       | No          | —             | Height of the flow container, used to scale the minimap.  |
| `width`            | `number`                       | No          | 200           | Width of the component.                                   |
| `height`           | `number`                       | No          | 150           | Height of the component.                                  |
| `position`         | `'top-left'                    | 'top-right' | 'bottom-left' | 'bottom-right'`                                           | No  | bottom-right | Position of the component. |
| `onViewportChange` | `(viewport: Viewport) => void` | No          | —             | Called with the new viewport when the minimap is dragged. |
| `className`        | `string`                       | No          | —             | Additional CSS class names merged onto the root element.  |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border-strong`
- `--cascivo-color-accent`

## Examples

### Graph overview

```jsx
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

## Boundaries

| Area | Level    | Note                       |
| ---- | -------- | -------------------------- |
| size | flexible | Configurable width/height. |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo FlowMiniMap component (display). A scaled SVG overview of the graph with a draggable viewport rectangle.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

FlowMiniMap is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-border-strong, --cascivo-color-accent

Accessibility: role "img", WCAG 2.1-AA. Keep it AA.
Flexible: size.

Do not invent props, tokens, or global viewport media queries.
```
