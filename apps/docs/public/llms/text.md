# Text

Body text with size, weight, and muted variants

## Install

```bash
npx cascade add text
```

## Category

`display`

## Variants

- `normal`
- `medium`
- `semibold`

## Sizes

- `sm`
- `md`
- `lg`

## Props

| Prop     | Type      | Required | Default     | Description |
| -------- | --------- | -------- | ----------- | ----------- | -------- | --- |
| `as`     | `'p'      | 'span'   | 'div'`      | no          | `p`      | —   |
| `size`   | `'sm'     | 'md'     | 'lg'`       | no          | `md`     | —   |
| `weight` | `'normal' | 'medium' | 'semibold'` | no          | `normal` | —   |
| `muted`  | `boolean` | no       | `false`     | —           |

## Examples

### Default

```tsx
<Text>Body copy reads at the base size.</Text>
```

### Muted helper

```tsx
<Text size="sm" muted>
  Secondary information
</Text>
```

### Inline span

Use as="span" inside other flow content

```tsx
<Text as="span" weight="semibold">
  emphasis
</Text>
```

## Design tokens

- `--cascivo-font-sans`
- `--cascivo-font-normal`
- `--cascivo-font-medium`
- `--cascivo-font-semibold`
- `--cascivo-leading-normal`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-text-sm`
- `--cascivo-text-base`
- `--cascivo-text-lg`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `paragraph`

## Dependencies

- `@cascade-ui/core`

## Tags

typography, text, paragraph, body
