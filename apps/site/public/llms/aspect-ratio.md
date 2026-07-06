# AspectRatio

Constrains content to a fixed width-to-height ratio

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add aspect-ratio
```

Or use it from the prebuilt package without copying:

```tsx
import { AspectRatio } from '@cascivo/react'
```

## Category

`layout`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `ratio` | `number` | no | `16 / 9` | Width-to-height ratio applied via the CSS aspect-ratio property |
| `children` | `ReactNode` | no | — | Content to fill the ratio box (typically an image, video, or iframe) |

## Examples

### Image at 16:9

```tsx
<AspectRatio ratio={16 / 9}>
  <img src="/cover.jpg" alt="Cover" />
</AspectRatio>
```

### Square

```tsx
<AspectRatio ratio={1}>
  <img src="/avatar.jpg" alt="Avatar" />
</AspectRatio>
```

## Design tokens

- `--cascivo-aspect-ratio`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `none`

## Dependencies

- `@cascivo/core`

## Tags

layout, ratio, image, video, responsive
