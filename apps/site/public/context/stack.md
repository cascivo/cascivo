# Stack

**Category:** layout  
**Description:** Overlaps children in a CSS grid stack with a configurable offset to create a card-pile effect

## When to use

- Card pile UI where depth and layering should be visible
- Overlapping avatar groups
- Notification stack visualisations

## When NOT to use

- Gap-based vertical/horizontal layout — that is a DIFFERENT component, `Flex` (`layout/flex`). This `Stack` only overlaps children with an offset.
- Independent positioned elements — use CSS position directly

## Anti-patterns

### The npm `Stack` overlaps its children by an offset — it does not do gap-based layout. Reach for `Flex` when you want gap-based flex layout.

**Bad:** `import { Stack } from '@cascivo/react' to space items vertically`  
**Good:** `For flex layout use Flex (import { Flex } from "@cascivo/react"); use this Stack only for a visual card-pile`  
**Why:** The npm `Stack` overlaps its children by an offset — it does not do gap-based layout. Reach for `Flex` when you want gap-based flex layout.

## Related components

- **layout/flex** (alternative): The flex layout primitive `Flex`, for gap-based vertical/horizontal stacking — a different component from this card-pile Stack.
- **Avatar** (pairs-with): Overlapping avatar groups are a primary use case for Stack
- **Card** (pairs-with): Card pile visualisations are a common Stack pattern

## Accessibility rationale

Stack is a layout-only container (role="none"). Each child must carry its own accessible semantics. Stacked cards that are interactive should each have a focusable element and a descriptive label.

## Props

| Name        | Type              | Required | Default | Description                                              |
| ----------- | ----------------- | -------- | ------- | -------------------------------------------------------- |
| `children`  | `React.ReactNode` | Yes      | —       | Content rendered inside the component.                   |
| `offset`    | `number`          | No       | 4       | Pixel offset applied per layer in both axes              |
| `className` | `string`          | No       | —       | Additional CSS class names merged onto the root element. |

## Examples

### Card pile

Three cards stacked with a 6px offset to show depth

```jsx
<Stack offset={6}>
  <Card>First</Card>
  <Card>Second</Card>
  <Card>Third</Card>
</Stack>
```

### Tight stack

Overlapping avatar group with minimal offset

```jsx
<Stack offset={2}>
  <Avatar src="/a.jpg" />
  <Avatar src="/b.jpg" />
  <Avatar src="/c.jpg" />
</Stack>
```

## Boundaries

| Area   | Level    | Note                                                                              |
| ------ | -------- | --------------------------------------------------------------------------------- |
| offset | flexible | The pixel offset is fully configurable; set to 0 for a pure overlap with no shift |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Stack component (layout). Overlaps children in a CSS grid stack with a configurable offset to create a card-pile effect

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Stack is strictly bound to these tokens — use only these, do not invent token names:
  none declared

Accessibility: role "none", WCAG 2.2-AA. Keep it AA.
Flexible: offset.

Do not invent props, tokens, or global viewport media queries.
```
