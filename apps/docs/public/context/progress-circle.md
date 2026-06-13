# ProgressCircle

**Category:** feedback  
**Description:** Circular determinate progress indicator rendered as an SVG arc

## When to use

- Showing determinate progress compactly as a circular arc
- Displaying a percentage in a small footprint (showValue)
- Tracking completion against a custom maximum (max)

## When NOT to use

- Indeterminate work with no known value — use Spinner
- Full-width linear progress with a label and helper text — use ProgressBar
- Multi-step flows — use ProgressIndicator

## Anti-patterns

### ProgressCircle requires a determinate value; it cannot express unknown progress

**Bad:** `Using ProgressCircle for indeterminate loading`  
**Good:** `<Spinner> for indeterminate states`  
**Why:** ProgressCircle requires a determinate value; it cannot express unknown progress

## Related components

- **ProgressBar** (alternative): Linear form with labels and indeterminate support
- **Spinner** (alternative): Indeterminate alternative when value is unknown

## Accessibility rationale

role="progressbar" with value/max conveys completion to assistive tech; the label prop supplies an accessible name since the SVG arc alone carries no text

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `number` | Yes | — | Current value from 0 to max — clamped |
| `max` | `number` | No | 100 | — |
| `size` | `'sm' | 'md' | 'lg'` | No | md | — |
| `showValue` | `boolean` | No | false | Renders the rounded percentage in the center — pairs best with md and lg |
| `label` | `string` | No | — | Accessible name announced by screen readers |

## Tokens

- `--cascade-color-border`
- `--cascade-color-accent`
- `--cascade-color-text`

## Examples

### Default

```jsx
<ProgressCircle value={40} label="Loading" />
```

### With value

```jsx
<ProgressCircle value={72} showValue size="lg" label="Upload progress" />
```

### Custom max

```jsx
<ProgressCircle value={3} max={8} label="Steps completed" />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| size and showValue | flexible | showValue pairs best with md/lg sizes |
| token names | strict | Arc and track colors must resolve to --cascade-* tokens |
