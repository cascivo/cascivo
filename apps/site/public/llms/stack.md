# Stack

Overlaps children in a CSS grid stack with a configurable offset to create a card-pile effect

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add stack
```

Or use it from the prebuilt package without copying:

```tsx
import { Stack } from '@cascivo/react'
```

## Category

`layout`

## Props

| Prop        | Type              | Required | Default | Description                                              |
| ----------- | ----------------- | -------- | ------- | -------------------------------------------------------- |
| `children`  | `React.ReactNode` | yes      | —       | Content rendered inside the component.                   |
| `offset`    | `number`          | no       | `4`     | Pixel offset applied per layer in both axes              |
| `className` | `string`          | no       | —       | Additional CSS class names merged onto the root element. |

## Examples

### Card pile

Three cards stacked with a 6px offset to show depth

```tsx
<Stack offset={6}>
  <Card>First</Card>
  <Card>Second</Card>
  <Card>Third</Card>
</Stack>
```

### Tight stack

Overlapping avatar group with minimal offset

```tsx
<Stack offset={2}>
  <Avatar src="/a.jpg" />
  <Avatar src="/b.jpg" />
  <Avatar src="/c.jpg" />
</Stack>
```

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `none`

## Tags

stack, pile, overlap, layered, z-axis, card-pile, layout
