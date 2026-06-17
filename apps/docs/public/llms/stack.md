# Stack

Overlaps children in a CSS grid stack with a configurable offset to create a card-pile effect

## Install

```bash
npx cascivo add stack
```

## Category

`layout`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `React.ReactNode` | yes | — | — |
| `offset` | `number` | no | `4` | Pixel offset applied per layer in both axes |
| `className` | `string` | no | — | — |

## Examples

### Card pile

Three cards stacked with a 6px offset to show depth

```tsx
<Stack offset={6}><Card>First</Card><Card>Second</Card><Card>Third</Card></Stack>
```

### Tight stack

Overlapping avatar group with minimal offset

```tsx
<Stack offset={2}><Avatar src="/a.jpg" /><Avatar src="/b.jpg" /><Avatar src="/c.jpg" /></Stack>
```

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `none`

## Tags

stack, pile, overlap, layout
