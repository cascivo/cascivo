# Card

Container for grouping related content

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add card
```

Or use it from the prebuilt package without copying:

```tsx
import { Card } from '@cascivo/react'
```

## Category

`display`

## Variants

- `default`
- `outlined`
- `elevated`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `actions` | `ReactNode` | no | — | CardHeader only — trailing content pinned to the inline-end (overflow menu, badge, link). The header is a column by default, so `justify-content: space-between` alone does nothing; this is how you get the title-left / action-right dashboard card. |
| `variant` | `'default' \| 'outlined' \| 'elevated'` | no | `default` | `default` draws a 1px border, `outlined` a heavier one, `elevated` drops the border for a shadow. |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | no | `md` | Inner padding of the CARD BOX. ⚠ `padding="none"` deliberately does NOT strip the padding from CardHeader/CardContent/CardFooter — those keep their own. It means "let a flush child (a LogViewer, an image, an edge-to-edge table) reach the card's edge"; zeroing both put the title flush against the border and made the mode unusable with the composition it exists for. For an edge-to-edge table, skip CardContent and pass the table as a direct child. |

## Examples

### Basic card

```tsx
<Card>
  <CardHeader><CardTitle>Title</CardTitle></CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-card`
- `--cascivo-shadow-md`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `region`

## Dependencies

- `@cascivo/core`

## Tags

container, layout, surface

---

_Generated from registry v0.18.0 on 2026-08-17. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
