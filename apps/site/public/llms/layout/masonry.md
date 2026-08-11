# Masonry

Masonry layout — native CSS masonry where supported, multi-column fallback elsewhere (fallback orders items top-to-bottom per column).

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add layout/masonry
```

_Copy-paste only — `Masonry` is not exported from `@cascivo/react`. Run the command above to own the source, or compose it from the exported primitives (`Flex`, `Grid`, `Heading`, …)._

## Category

`layout`

## Props

| Prop   | Type                          | Required | Default | Description        |
| ------ | ----------------------------- | -------- | ------- | ------------------ |
| `cols` | `number`                      | no       | `3`     | Number of columns  |
| `gap`  | `1\|2\|3\|4\|5\|6\|8\|10\|12` | no       | `4`     | Spacing token step |

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

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Design tokens

- `--cascivo-space-*`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascivo/core`

## Tags

layout, masonry, gallery

---

_Generated from registry v0.17.0 on 2026-08-11. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
