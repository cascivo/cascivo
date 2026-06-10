# Tag

Compact chip for labeling, categorizing, or filtering content

## Install

```bash
npx cascade add tag
```

## Category

`display`

## Variants

- `default`
- `info`
- `success`
- `warning`
- `error`

## Sizes

- `sm`
- `md`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `variant` | `'default' | 'info' | 'success' | 'warning' | 'error'` | no | `default` | — |
| `size` | `'sm' | 'md'` | no | `md` | — |
| `onDismiss` | `() => void` | no | — | When provided, renders a trailing remove button inside the chip |
| `dismissLabel` | `string` | no | `Remove` | — |

## Examples

### Default

```tsx
<Tag>Design</Tag>
```

### Success

```tsx
<Tag variant="success">Approved</Tag>
```

### Dismissible

Renders a trailing remove button labeled by dismissLabel

```tsx
<Tag onDismiss={() => removeFilter()}>Filter: Active</Tag>
```

## Design tokens

- `--cascade-color-bg-subtle`
- `--cascade-color-text-subtle`
- `--cascade-color-info`
- `--cascade-color-info-subtle`
- `--cascade-color-success`
- `--cascade-color-success-subtle`
- `--cascade-color-warning`
- `--cascade-color-warning-subtle`
- `--cascade-color-destructive`
- `--cascade-color-destructive-subtle`
- `--cascade-radius-badge`
- `--cascade-focus-ring`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `none`
- **Keyboard:** Enter, Space

## Dependencies

- `@cascade-ui/core`
- `@cascade-ui/i18n`

## Tags

chip, label, filter, category
