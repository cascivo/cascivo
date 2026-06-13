# Stack

Flex layout primitive for vertical or horizontal stacking with gap control.

## Install

```bash
npx cascivo add layout/stack
```

## Category

`layout`

## Props

| Prop        | Type        | Required      | Default | Description    |
| ----------- | ----------- | ------------- | ------- | -------------- | -------------- | --- | --------------- | --- | --- | --- | --- | ------------------ |
| `direction` | `'vertical' | 'horizontal'` | no      | —              | Flex direction |
| `gap`       | `1          | 2             | 3       | 4              | 5              | 6   | 8               | 10  | 12` | no  | —   | Spacing token step |
| `align`     | `'start'    | 'center'      | 'end'   | 'stretch'`     | no             | —   | align-items     |
| `justify`   | `'start'    | 'center'      | 'end'   | 'between'`     | no             | —   | justify-content |
| `wrap`      | `boolean`   | no            | —       | Allow wrapping |

## Examples

### Vertical

Default vertical stack

```tsx
<Stack gap={4}>
  <div>A</div>
  <div>B</div>
</Stack>
```

### Horizontal

Row layout

```tsx
<Stack direction="horizontal" gap={2}>
  <div>A</div>
  <div>B</div>
</Stack>
```

## Design tokens

- `--cascivo-space-*`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascivo/core`

## Tags

layout, flex, stack, spacing
