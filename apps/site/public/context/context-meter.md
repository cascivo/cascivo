# ContextMeter

**Category:** feedback  
**Description:** How much of a model’s context window a conversation has used — "12K / 200K" with a bar that warns as it fills

## When to use

- Showing how much of the model’s context window a conversation or document has used
- Warning before a conversation hits the limit and older turns are dropped

## When NOT to use

- Task progress toward completion — use ProgressBar
- Account-level usage and billing quotas with many figures — use Stat or a chart

## Anti-patterns

### Colour is not perceivable by everyone; the numbers carry the meaning

**Bad:** `Colour alone to signal the window is nearly full`  
**Good:** `Keep the "used / max" figures visible; colour reinforces them`  
**Why:** Colour is not perceivable by everyone; the numbers carry the meaning

## Related components

- **ProgressBar** (alternative): ProgressBar is for progress toward done; a meter measures a level within a range
- **AiStatus** (pairs-with): Both sit in an AI chat’s header or footer

## Accessibility rationale

role="meter" with aria-valuenow/min/max and an aria-valuetext in full words ("12,400 of 200,000 tokens used (6%)"), named by its label. The compact visible line is aria-hidden so it is not read twice. Colour steps to warning at 80% and destructive at 95%, but the figures always carry the meaning

## Props

| Name     | Type                 | Required | Default | Description                                                                                                                               |
| -------- | -------------------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `value`  | `number`             | Yes      | —       | Tokens used so far.                                                                                                                       |
| `max`    | `number`             | Yes      | —       | The context window size, in tokens.                                                                                                       |
| `label`  | `string`             | No       | Context | The meter’s name, shown above the bar. Rendered on screen.                                                                                |
| `labels` | `{ usage?: string }` | No       | —       | Overrides for the component’s user-visible strings (i18n). `usage` is the spoken value and may contain `{used}`, `{max}` and `{percent}`. |

## Tokens

- `--cascivo-color-ai`
- `--cascivo-color-warning`
- `--cascivo-color-destructive`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-radius-full`

## Examples

### Plenty left

```jsx
<ContextMeter value={12400} max={200000} />
```

### Nearly full

```jsx
<ContextMeter value={192000} max={200000} />
```

## Boundaries

| Area              | Level    | Note                                                        |
| ----------------- | -------- | ----------------------------------------------------------- |
| label and wording | flexible | Rename via label; reword via labels.usage                   |
| thresholds        | strict   | Warning at 80%, full at 95% — consistent across every meter |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo ContextMeter component (feedback). How much of a model’s context window a conversation has used — "12K / 200K" with a bar that warns as it fills

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

ContextMeter is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-ai, --cascivo-color-warning, --cascivo-color-destructive, --cascivo-color-bg-subtle, --cascivo-color-text, --cascivo-color-text-muted, --cascivo-radius-full

Accessibility: role "meter", WCAG 2.2-AA. Keep it AA.

Do not change (strict): thresholds — Warning at 80%, full at 95% — consistent across every meter
Flexible: label and wording.

Do not invent props, tokens, or global viewport media queries.
```
