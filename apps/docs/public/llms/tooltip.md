# Tooltip

Contextual label shown on hover or focus

## Install

```bash
npx cascade add tooltip
```

## Category

`overlay`

## States

- `hidden`
- `visible`

## Props

| Prop        | Type           | Required | Default  | Description                         |
| ----------- | -------------- | -------- | -------- | ----------------------------------- | --- | ----- | --- |
| `content`   | `ReactNode`    | yes      | —        | —                                   |
| `placement` | `'top'         | 'right'  | 'bottom' | 'left'`                             | no  | `top` | —   |
| `children`  | `ReactElement` | yes      | —        | —                                   |
| `delay`     | `number`       | no       | `200`    | Milliseconds to wait before showing |

## Examples

### Basic

```tsx
<Tooltip content="Copy to clipboard">
  <Button>Copy</Button>
</Tooltip>
```

## Design tokens

- `--cascade-color-text`
- `--cascade-color-text-on-accent`
- `--cascade-radius-sm`
- `--cascade-z-tooltip`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `tooltip`
- **Keyboard:** Tab, Escape

## Dependencies

- `@cascade-ui/core`

## Tags

overlay, hint, popover
