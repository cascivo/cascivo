# MediaMasonry

Masonry gallery section — native CSS masonry where supported, multi-column fallback elsewhere (fallback orders tiles top-to-bottom per column). Tiles style themselves; section provides only the layout shell.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add section/media-masonry
```

_Copy-paste only — this block/layout is not published as an importable package._

## Category

`layout`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `ReactNode` | yes | — | Tile elements (images, cards, quotes) — consumer-provided and self-styled |
| `title` | `ReactNode` | no | — | Section heading above the gallery |
| `description` | `ReactNode` | no | — | Subheading below the section title |
| `headingLevel` | `1 \| 2 \| 3` | no | `2` | HTML heading level for the section title |
| `cols` | `number` | no | `3` | Number of masonry columns |
| `gap` | `1\|2\|3\|4\|5\|6\|8\|10\|12` | no | `4` | Gap between tiles (spacing token step) |

## Examples

### Media gallery

Masonry gallery with three image tiles; falls back to CSS columns in unsupported browsers

```tsx
<MediaMasonry title="Customer stories" cols={3} gap={4}><img src="/photo-1.jpg" alt="Team at desk" /><img src="/photo-2.jpg" alt="Product screenshot" /><img src="/photo-3.jpg" alt="Dashboard view" /></MediaMasonry>
```

## Design tokens

- `--cascivo-text-2xl`
- `--cascivo-text-base`
- `--cascivo-font-bold`
- `--cascivo-text-secondary`
- `--cascivo-space-*`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `region`

## Dependencies

- `@cascivo/core`

## Tags

section, gallery, masonry
