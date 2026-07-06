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
| `max` | `number` | No | 100 | Maximum allowed value. |
| `size` | `'sm' \| 'md' \| 'lg'` | No | md | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `showValue` | `boolean` | No | false | Renders the rounded percentage in the center — pairs best with md and lg |
| `label` | `string` | No | — | Accessible name announced by screen readers |

## Tokens

- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-color-text`

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
| token names | strict | Arc and track colors must resolve to --cascivo-* tokens |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo ProgressCircle component (feedback). Circular determinate progress indicator rendered as an SVG arc

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

ProgressCircle is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-border, --cascivo-color-accent, --cascivo-color-text

Accessibility: role "progressbar", WCAG 2.2-AA. Keep it AA.

Do not change (strict): token names — Arc and track colors must resolve to --cascivo-* tokens
Flexible: size and showValue.

Do not invent props, tokens, or global viewport media queries.
```
