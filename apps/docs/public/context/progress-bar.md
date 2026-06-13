# ProgressBar

**Category:** feedback  
**Description:** Shows determinate or indeterminate progress of a task

## When to use

- Showing linear determinate progress of a task with a known percentage (value)
- Indicating ongoing work of unknown duration (omit value for indeterminate)
- Reflecting success/error outcome of a tracked operation (status)

## When NOT to use

- A compact circular indicator is preferred — use ProgressCircle
- Pure indeterminate spinning with no track — use Spinner
- Stepping through a multi-step flow — use ProgressIndicator

## Anti-patterns

### A determinate bar implies a meaningful percentage; faking it misleads the user

**Bad:** `A determinate ProgressBar with a faked, jumping value`  
**Good:** `Omit value for an indeterminate bar when real progress is unknown`  
**Why:** A determinate bar implies a meaningful percentage; faking it misleads the user

## Related components

- **ProgressCircle** (alternative): Circular form for compact determinate progress
- **Spinner** (alternative): Spinner for indeterminate work with no track

## Accessibility rationale

role="progressbar" with value/max exposes completion to assistive tech; the label is wired via aria-labelledby and success/error states add a glyph so outcome is not color-only

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `number` | No | — | Current value from 0 to max; omit for an indeterminate bar |
| `max` | `number` | No | 100 | — |
| `label` | `string` | No | — | Visible label above the track, wired via aria-labelledby |
| `helperText` | `string` | No | — | — |
| `size` | `'sm' | 'md'` | No | md | — |
| `status` | `'active' | 'success' | 'error'` | No | active | success/error tint the fill and show a glyph next to the label |

## Tokens

- `--cascade-color-accent`
- `--cascade-color-success`
- `--cascade-color-destructive`
- `--cascade-color-border`
- `--cascade-color-text`
- `--cascade-color-text-subtle`
- `--cascade-radius-full`
- `--cascade-motion-enter`

## Examples

### Determinate

```jsx
<ProgressBar value={60} label="Uploading" />
```

### Indeterminate

```jsx
<ProgressBar label="Processing" />
```

### Success

```jsx
<ProgressBar value={100} status="success" label="Upload complete" />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| determinate vs indeterminate | flexible | Presence of value selects the mode |
| token names | strict | Fill and status colors must resolve to --cascade-* tokens |
