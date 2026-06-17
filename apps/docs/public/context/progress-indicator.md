# ProgressIndicator

**Category:** navigation  
**Description:** Shows progress through the steps of a multi-step flow

## When to use

- Showing progress through the discrete steps of a multi-step flow (wizard, checkout)
- Communicating which step is complete, current, and upcoming
- Laying out steps horizontally or vertically with optional descriptions

## When NOT to use

- Continuous task progress with a percentage — use ProgressBar or ProgressCircle
- Indeterminate loading — use Spinner

## Anti-patterns

### ProgressIndicator models discrete steps, not a continuous quantity

**Bad:** `Using ProgressIndicator to show a download percentage`  
**Good:** `<ProgressBar value={pct}> for continuous progress`  
**Why:** ProgressIndicator models discrete steps, not a continuous quantity

## Related components

- **ProgressBar** (alternative): ProgressBar shows continuous progress; this shows discrete steps

## Accessibility rationale

role="list" structures the steps in order; the current step is conveyed as text/state rather than color alone, so screen-reader users know where they are in the flow

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `steps` | `{ label: string; description?: string }[]` | Yes | — | Ordered list of steps |
| `currentIndex` | `number` | Yes | — | Index of the current step (0-based) |
| `vertical` | `boolean` | No | false | — |
| `className` | `string` | No | — | — |

## Tokens

- `--cascivo-color-accent`
- `--cascivo-color-accent-subtle`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-text-subtle`
- `--cascivo-color-text-on-accent`
- `--cascivo-color-border`
- `--cascivo-color-surface`
- `--cascivo-radius-full`

## Examples

### Horizontal

```jsx
<ProgressIndicator steps={[{ label: 'Cart' }, { label: 'Shipping' }, { label: 'Payment' }]} currentIndex={1} />
```

### Vertical with descriptions

```jsx
<ProgressIndicator vertical steps={[{ label: 'Account', description: 'Your details' }, { label: 'Confirm' }]} currentIndex={0} />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| orientation | flexible | horizontal or vertical to fit the layout |
| token names | strict | Step and connector colors must resolve to --cascivo-* tokens |
