# Join

Groups adjacent children into a seamless joined element by removing interior borders and radii

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add join
```

Or use it from the prebuilt package without copying:

```tsx
import { Join } from '@cascivo/react'
```

## Category

`layout`

## Props

| Prop          | Type              | Required    | Default | Description  |
| ------------- | ----------------- | ----------- | ------- | ------------ | --- |
| `children`    | `React.ReactNode` | yes         | —       | —            |
| `orientation` | `'horizontal'     | 'vertical'` | no      | `horizontal` | —   |
| `className`   | `string`          | no          | —       | —            |

## Examples

### Search group

Input and button joined into a single search control

```tsx
<Join>
  <Input placeholder="Search…" />
  <Button>Go</Button>
</Join>
```

### Segmented buttons

Segmented button row with no gaps between items

```tsx
<Join>
  <Button variant="secondary">Day</Button>
  <Button variant="secondary">Week</Button>
  <Button variant="secondary">Month</Button>
</Join>
```

### Vertical stack

Vertically joined button group

```tsx
<Join orientation="vertical">
  <Button>Top</Button>
  <Button>Middle</Button>
  <Button>Bottom</Button>
</Join>
```

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `none`

## Tags

group, join, segmented, layout
