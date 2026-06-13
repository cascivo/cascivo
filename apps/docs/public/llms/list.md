# List

Styled unordered or ordered list with ListItem

## Install

```bash
npx cascade add list
```

## Category

`display`

## Variants

- `disc`
- `decimal`
- `none`

## Props

| Prop     | Type    | Required  | Default | Description |
| -------- | ------- | --------- | ------- | ----------- | --------------------------------------- | --- |
| `as`     | `'ul'   | 'ol'`     | no      | `ul`        | —                                       |
| `marker` | `'disc' | 'decimal' | 'none'` | no          | `derived from as (ul→disc, ol→decimal)` | —   |

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

- `--cascade-font-sans`
- `--cascade-leading-normal`
- `--cascade-color-text`
- `--cascade-text-base`
- `--cascade-space-1`
- `--cascade-space-6`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `list`

## Dependencies

- `@cascade-ui/core`

## Tags

typography, list, ul, ol
