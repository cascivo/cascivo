# Card

Container for grouping related content

## Install

```bash
npx cascivo add card
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
| `variant` | `'default' | 'outlined' | 'elevated'` | no | `default` | — |
| `padding` | `'none' | 'sm' | 'md' | 'lg'` | no | `md` | — |

## Examples

### Basic card

```tsx
<Card>
  <CardHeader><CardTitle>Title</CardTitle></CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

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
