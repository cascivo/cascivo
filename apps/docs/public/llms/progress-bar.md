# ProgressBar

Shows determinate or indeterminate progress of a task

## Install

```bash
npx cascivo add progress-bar
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

| Prop         | Type      | Required  | Default  | Description                                                |
| ------------ | --------- | --------- | -------- | ---------------------------------------------------------- | -------- | -------------------------------------------------------------- |
| `value`      | `number`  | no        | —        | Current value from 0 to max; omit for an indeterminate bar |
| `max`        | `number`  | no        | `100`    | —                                                          |
| `label`      | `string`  | no        | —        | Visible label above the track, wired via aria-labelledby   |
| `helperText` | `string`  | no        | —        | —                                                          |
| `size`       | `'sm'     | 'md'`     | no       | `md`                                                       | —        |
| `status`     | `'active' | 'success' | 'error'` | no                                                         | `active` | success/error tint the fill and show a glyph next to the label |

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
