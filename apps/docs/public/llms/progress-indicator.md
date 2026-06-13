# ProgressIndicator

Shows progress through the steps of a multi-step flow

## Install

```bash
npx cascade add progress-indicator
```

## Category

`navigation`

## Variants

- `horizontal`
- `vertical`

## States

- `complete`
- `current`
- `incomplete`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `steps` | `{ label: string; description?: string }[]` | yes | — | Ordered list of steps |
| `currentIndex` | `number` | yes | — | Index of the current step (0-based) |
| `vertical` | `boolean` | no | `false` | — |
| `className` | `string` | no | — | — |

## Examples

### Horizontal

```tsx
<ProgressIndicator steps={[{ label: 'Cart' }, { label: 'Shipping' }, { label: 'Payment' }]} currentIndex={1} />
```

### Vertical with descriptions

```tsx
<ProgressIndicator vertical steps={[{ label: 'Account', description: 'Your details' }, { label: 'Confirm' }]} currentIndex={0} />
```

## Design tokens

- `--cascade-color-accent`
- `--cascade-color-accent-subtle`
- `--cascade-color-text`
- `--cascade-color-text-muted`
- `--cascade-color-text-subtle`
- `--cascade-color-text-on-accent`
- `--cascade-color-border`
- `--cascade-color-surface`
- `--cascade-radius-full`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `list`

## Dependencies

- `@cascade-ui/core`

## Tags

steps, wizard, stepper, progress, navigation
