# Progress

Horizontal bar showing the completion progress of a tracked operation

## Install

```bash
npx cascivo add progress
```

## Category

`feedback`

## Variants

- `primary`
- `info`
- `success`
- `warning`
- `error`

## Sizes

- `sm`
- `md`
- `lg`

## States

- `determinate`
- `indeterminate`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `number` | no | — | 0–100. Omit for indeterminate state. |
| `variant` | `'primary' | 'info' | 'success' | 'warning' | 'error'` | no | `primary` | — |
| `size` | `'sm' | 'md' | 'lg'` | no | `md` | — |

## Examples

### Determinate

```tsx
<Progress value={65} />
```

### Indeterminate

```tsx
<Progress aria-label="Loading…" />
```

### Success variant

```tsx
<Progress value={100} variant="success" />
```

### Small

```tsx
<Progress value={40} size="sm" />
```

## Design tokens

- `--cascivo-color-surface-2`
- `--cascivo-color-primary`
- `--cascivo-color-info`
- `--cascivo-color-success`
- `--cascivo-color-warning`
- `--cascivo-color-error`
- `--cascivo-color-accent`
- `--cascivo-radius-full`
- `--cascivo-ease-out`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `progressbar`

## Dependencies

- `@cascivo/core`

## Tags

progress, loading, upload, bar
