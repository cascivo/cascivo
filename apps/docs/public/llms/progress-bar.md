# ProgressBar

Shows determinate or indeterminate progress of a task

## Install

```bash
npx cascade add progress-bar
```

## Category

`feedback`

## Variants

- `active`
- `success`
- `error`

## Sizes

- `sm`
- `md`

## States

- `determinate`
- `indeterminate`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `number` | no | — | Current value from 0 to max; omit for an indeterminate bar |
| `max` | `number` | no | `100` | — |
| `label` | `string` | no | — | Visible label above the track, wired via aria-labelledby |
| `helperText` | `string` | no | — | — |
| `size` | `'sm' | 'md'` | no | `md` | — |
| `status` | `'active' | 'success' | 'error'` | no | `active` | success/error tint the fill and show a glyph next to the label |

## Examples

### Determinate

```tsx
<ProgressBar value={60} label="Uploading" />
```

### Indeterminate

```tsx
<ProgressBar label="Processing" />
```

### Success

```tsx
<ProgressBar value={100} status="success" label="Upload complete" />
```

## Design tokens

- `--cascade-color-accent`
- `--cascade-color-success`
- `--cascade-color-destructive`
- `--cascade-color-border`
- `--cascade-color-text`
- `--cascade-color-text-subtle`
- `--cascade-radius-full`
- `--cascade-motion-enter`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `progressbar`

## Dependencies

- `@cascade-ui/core`

## Tags

progress, loading, status, feedback
