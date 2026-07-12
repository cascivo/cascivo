# ProgressBar

Shows determinate or indeterminate progress of a task

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add progress-bar
```

Or use it from the prebuilt package without copying:

```tsx
import { ProgressBar } from '@cascivo/react'
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
| `max` | `number` | no | `100` | Maximum allowed value. |
| `label` | `string` | no | — | Visible label above the track, wired via aria-labelledby |
| `helperText` | `string` | no | — | Supplementary text shown with the progress bar. |
| `size` | `'sm' \| 'md'` | no | `md` | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `status` | `'active' \| 'success' \| 'error'` | no | `active` | success/error tint the fill and show a glyph next to the label |

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

- `--cascivo-color-accent`
- `--cascivo-color-success`
- `--cascivo-color-destructive`
- `--cascivo-color-border`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-radius-full`
- `--cascivo-motion-enter`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `progressbar`

## Dependencies

- `@cascivo/core`

## Tags

progress, loading, status, feedback
