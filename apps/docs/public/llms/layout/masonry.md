# Masonry

Masonry layout — native CSS masonry where supported, multi-column fallback elsewhere (fallback orders items top-to-bottom per column).

## Install

```bash
npx cascade add layout/masonry
```

## Category

`layout`

## Props

| Prop   | Type     | Required | Default | Description       |
| ------ | -------- | -------- | ------- | ----------------- | --- | --- | --- | --- | --- | --- | --- | ------------------ |
| `cols` | `number` | no       | `3`     | Number of columns |
| `gap`  | `1       | 2        | 3       | 4                 | 5   | 6   | 8   | 10  | 12` | no  | `4` | Spacing token step |

## Examples

### Masonry gallery

Variable-height cards laid out in a masonry pattern; falls back to CSS columns

```tsx
<Masonry cols={3} gap={4}>
  {items.map((item) => (
    <Card key={item.id}>{item.content}</Card>
  ))}
</Masonry>
```

## Design tokens

- `--cascade-space-*`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascade-ui/core`

## Tags

layout, masonry, gallery
