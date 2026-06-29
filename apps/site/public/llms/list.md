# List

Styled unordered or ordered list with ListItem

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add list
```

Or use it from the prebuilt package without copying:

```tsx
import { List } from '@cascivo/react'
```

## Category

`display`

## Variants

- `disc`
- `decimal`
- `none`

## Props

| Prop     | Type    | Required  | Default | Description |
| -------- | ------- | --------- | ------- | ----------- | --------------------------------------- | ------------------------- | --------- | -------- |
| `as`     | `'ul'   | 'ol'`     | no      | `ul`        | The HTML element to render as.          |
| `marker` | `'disc' | 'decimal' | 'none'` | no          | `derived from as (ul→disc, ol→decimal)` | List marker style ('disc' | 'decimal' | 'none'). |

## Examples

### Unordered

```tsx
<List>
  <ListItem>Tokens</ListItem>
  <ListItem>Themes</ListItem>
</List>
```

### Ordered

```tsx
<List as="ol">
  <ListItem>Init</ListItem>
  <ListItem>Add</ListItem>
</List>
```

### Unmarked

Keeps list semantics without visual markers

```tsx
<List marker="none">
  <ListItem>Clean row</ListItem>
</List>
```

## Design tokens

- `--cascivo-font-sans`
- `--cascivo-leading-normal`
- `--cascivo-color-text`
- `--cascivo-text-base`
- `--cascivo-space-1`
- `--cascivo-space-6`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `list`

## Dependencies

- `@cascivo/core`

## Tags

typography, list, ul, ol
