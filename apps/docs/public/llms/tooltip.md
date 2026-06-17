# Tooltip

Contextual label shown on hover or focus

## Install

```bash
npx cascivo add tooltip
```

## Category

`overlay`

## States

- `hidden`
- `visible`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `content` | `ReactNode` | yes | — | — |
| `placement` | `'top' | 'right' | 'bottom' | 'left'` | no | `top` | — |
| `children` | `ReactElement` | yes | — | — |
| `delay` | `number` | no | `200` | Milliseconds to wait before showing |

## Examples

### Basic

```tsx
<Tooltip content="Copy to clipboard"><Button>Copy</Button></Tooltip>
```

## Design tokens

- `--cascivo-color-text`
- `--cascivo-color-text-on-accent`
- `--cascivo-radius-sm`
- `--cascivo-z-tooltip`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `tooltip`
- **Keyboard:** Tab, Escape

## Dependencies

- `@cascivo/core`

## Tags

overlay, hint, popover
