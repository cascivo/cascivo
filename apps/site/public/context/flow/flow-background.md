# FlowBackground

**Category:** display  
**Description:** Decorative dots / grid / cross canvas background, drawn purely in CSS gradients.

## When to use

- Giving a flow canvas a sense of space and scale with a dotted or grid backdrop
- Reinforcing pan/zoom by letting the pattern move and scale with the viewport

## When NOT to use

- As a page background — this is a flow-canvas decoration, not a general surface

## Anti-patterns

### Per-cell DOM is needlessly expensive; one repeating gradient costs nothing.

**Bad:** `Rendering a DOM node per grid cell`  
**Good:** `A single CSS gradient layer`  
**Why:** Per-cell DOM is needlessly expensive; one repeating gradient costs nothing.

## Related components

- **FlowCanvas** (contained-by): Lives inside the canvas pane.

## Accessibility rationale

Purely decorative — marked aria-hidden and presentation, never in the a11y tree.

## Props

| Name        | Type     | Required | Default  | Description                                              |
| ----------- | -------- | -------- | -------- | -------------------------------------------------------- | ---- | -------------- |
| `variant`   | `'dots'  | 'grid'   | 'cross'` | No                                                       | dots | Pattern style. |
| `gap`       | `number` | No       | 20       | Cell spacing (px).                                       |
| `size`      | `number` | No       | 1        | Dot radius / line thickness (px).                        |
| `color`     | `string` | No       | —        | Pattern color (defaults to the border token).            |
| `className` | `string` | No       | —        | Additional CSS class names merged onto the root element. |

## Tokens

- `--cascivo-color-border`

## Examples

### Dotted background

A dotted grid behind a flow canvas.

```jsx
;() => (
  <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
    <FlowBackground variant="dots" gap={24} />
  </div>
)
```

### Grid and cross

The grid and cross variants.

```jsx
;() => (
  <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
    <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
      <FlowBackground variant="grid" gap={28} />
    </div>
    <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
      <FlowBackground variant="cross" gap={28} size={4} />
    </div>
  </div>
)
```

## Boundaries

| Area    | Level    | Note |
| ------- | -------- | ---- | ---- | --------------------------------- |
| pattern | flexible | dots | grid | cross with configurable gap/size. |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo FlowBackground component (display). Decorative dots / grid / cross canvas background, drawn purely in CSS gradients.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

FlowBackground is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-border

Accessibility: role "presentation", WCAG 2.1-AA. Keep it AA.
Flexible: pattern.

Do not invent props, tokens, or global viewport media queries.
```
