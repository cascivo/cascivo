# Progress

**Category:** feedback  
**Description:** Horizontal bar showing the completion progress of a tracked operation

## When to use

- Tracked operations with a known total (file uploads, multi-step imports)
- Showing completion percentage of a long-running task

## When NOT to use

- Unbounded waits of unknown duration — use Spinner
- Single-action button loading state — use the button's own loading prop

## Anti-patterns

### Indeterminate progress bars must have an aria-label so screen readers can announce what is loading

**Bad:** `<Progress />`  
**Good:** `<Progress aria-label="Uploading file…" />`  
**Why:** Indeterminate progress bars must have an aria-label so screen readers can announce what is loading

## Related components

- **Spinner** (alternative): Spinner is for unbounded waits; Progress is for operations with a known end point
- **ProgressBar** (alternative): ProgressBar is the richer compound variant with label and percentage display

## Accessibility rationale

Uses the native <progress> element which maps to role="progressbar" automatically; aria-label or aria-labelledby is required for indeterminate state

## Props

| Name      | Type       | Required | Default   | Description                          |
| --------- | ---------- | -------- | --------- | ------------------------------------ | -------- | --- | ------- | --- |
| `value`   | `number`   | No       | —         | 0–100. Omit for indeterminate state. |
| `variant` | `'primary' | 'info'   | 'success' | 'warning'                            | 'error'` | No  | primary | —   |
| `size`    | `'sm'      | 'md'     | 'lg'`     | No                                   | md       | —   |

## Tokens

- `--cascivo-color-surface-2`
- `--cascivo-color-primary`
- `--cascivo-color-info`
- `--cascivo-color-success`
- `--cascivo-color-warning`
- `--cascivo-color-error`
- `--cascivo-color-accent`
- `--cascivo-radius-full`
- `--cascivo-ease-out`

## Examples

### Determinate

```jsx
<Progress value={65} />
```

### Indeterminate

```jsx
<Progress aria-label="Loading…" />
```

### Success variant

```jsx
<Progress value={100} variant="success" />
```

### Small

```jsx
<Progress value={40} size="sm" />
```

## Boundaries

| Area        | Level    | Note                                                                  |
| ----------- | -------- | --------------------------------------------------------------------- |
| variant     | flexible | Choose the variant that matches the semantic meaning of the operation |
| token names | strict   | Colors must resolve to --cascivo-\* tokens                            |
