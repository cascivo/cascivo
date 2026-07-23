# Item

Generic content row primitive with media, content, and action regions

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add item
```

Or use it from the prebuilt package without copying:

```tsx
import { Item } from '@cascivo/react'
```

## Category

`display`

## Variants

- `default`
- `muted`

## Sizes

- `sm`
- `md`

## Props

| Prop      | Type                   | Required | Default   | Description                                                                                       |
| --------- | ---------------------- | -------- | --------- | ------------------------------------------------------------------------------------------------- |
| `asChild` | `boolean`              | no       | `false`   | When true, renders the child element as the root via Slot, merging props (polymorphic rendering). |
| `variant` | `'default' \| 'muted'` | no       | `default` | Selects the visual style variant.                                                                 |
| `size`    | `'sm' \| 'md'`         | no       | `md`      | Visual size of the component (e.g. 'sm', 'md', 'lg').                                             |

## Examples

### Item with media, content, and actions

```tsx
<Item>
  <ItemMedia>
    <Avatar />
  </ItemMedia>
  <ItemContent>
    <ItemTitle>Ada Lovelace</ItemTitle>
    <ItemDescription>Mathematician</ItemDescription>
  </ItemContent>
  <ItemActions>
    <Button size="sm">Edit</Button>
  </ItemActions>
</Item>
```

### As a link via asChild

```tsx
<Item asChild>
  <a href="/profile">
    <ItemContent>
      <ItemTitle>Profile</ItemTitle>
    </ItemContent>
  </a>
</Item>
```

## Design tokens

- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-item`
- `--cascivo-space-3`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `none`

## Dependencies

- `@cascivo/core`

## Tags

row, primitive, list-item, layout

---

_Generated from registry v0.10.0 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
