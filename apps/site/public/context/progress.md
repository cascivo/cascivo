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

| Name      | Type                                                       | Required | Default | Description                                           |
| --------- | ---------------------------------------------------------- | -------- | ------- | ----------------------------------------------------- |
| `value`   | `number`                                                   | No       | —       | 0–100. Omit for indeterminate state.                  |
| `variant` | `'primary' \| 'info' \| 'success' \| 'warning' \| 'error'` | No       | primary | Selects the visual style variant.                     |
| `size`    | `'sm' \| 'md' \| 'lg'`                                     | No       | md      | Visual size of the component (e.g. 'sm', 'md', 'lg'). |

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

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Progress component (feedback). Horizontal bar showing the completion progress of a tracked operation

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Progress is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface-2, --cascivo-color-primary, --cascivo-color-info, --cascivo-color-success, --cascivo-color-warning, --cascivo-color-error, --cascivo-color-accent, --cascivo-radius-full, --cascivo-ease-out

Accessibility: role "progressbar", WCAG 2.2-AA. Keep it AA.

Do not change (strict): token names — Colors must resolve to --cascivo-* tokens
Flexible: variant.

Do not invent props, tokens, or global viewport media queries.
```
