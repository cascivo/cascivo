# Card

Container for grouping related content

## Install

```bash
npx cascade add card
```

## Category

`display`

## Variants

- `default`
- `outlined`
- `elevated`

## Props

| Prop      | Type       | Required   | Default     | Description |
| --------- | ---------- | ---------- | ----------- | ----------- | --------- | ---- | --- |
| `variant` | `'default' | 'outlined' | 'elevated'` | no          | `default` | —    |
| `padding` | `'none'    | 'sm'       | 'md'        | 'lg'`       | no        | `md` | —   |

## Examples

### Basic card

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

## Design tokens

- `--cascade-color-surface`
- `--cascade-color-border`
- `--cascade-radius-card`
- `--cascade-shadow-md`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `region`

## Dependencies

- `@cascade-ui/core`

## Tags

container, layout, surface
