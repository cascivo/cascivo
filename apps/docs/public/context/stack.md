# Stack

**Category:** layout  
**Description:** Overlaps children in a CSS grid stack with a configurable offset to create a card-pile effect

## When to use

- Card pile UI where depth and layering should be visible
- Overlapping avatar groups
- Notification stack visualisations

## When NOT to use

- Normal vertical lists — use a flex column or VStack instead
- Independent positioned elements — use CSS position directly

## Related components

- **Avatar** (pairs-with): Overlapping avatar groups are a primary use case for Stack
- **Card** (pairs-with): Card pile visualisations are a common Stack pattern

## Accessibility rationale

Stack is a layout-only container (role="none"). Each child must carry its own accessible semantics. Stacked cards that are interactive should each have a focusable element and a descriptive label.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `React.ReactNode` | Yes | — | — |
| `offset` | `number` | No | 4 | Pixel offset applied per layer in both axes |
| `className` | `string` | No | — | — |

## Examples

### Card pile

Three cards stacked with a 6px offset to show depth

```jsx
<Stack offset={6}><Card>First</Card><Card>Second</Card><Card>Third</Card></Stack>
```

### Tight stack

Overlapping avatar group with minimal offset

```jsx
<Stack offset={2}><Avatar src="/a.jpg" /><Avatar src="/b.jpg" /><Avatar src="/c.jpg" /></Stack>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| offset | flexible | The pixel offset is fully configurable; set to 0 for a pure overlap with no shift |
