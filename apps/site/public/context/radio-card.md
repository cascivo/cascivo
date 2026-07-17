# RadioCard

**Category:** inputs  
**Description:** Selectable card backed by a native radio input. Use RadioCardGroup for single-select groups.

## When to use

- Single-select from a few options where each choice needs a title plus supporting description (plans, tiers, shipping methods)
- Selection UIs where a larger, more prominent click target improves clarity over a plain radio

## When NOT to use

- Plain text options with no description — use Radio for a lighter footprint
- A compact inline switch between a few modes — use SegmentedControl
- Too many options to render as cards — use Select

## Anti-patterns

### RadioCard reads its name, selected value, and change handler from RadioCardGroup context; outside a group it has no shared name and cannot enforce single-selection

**Bad:** `<RadioCard ... /> rendered standalone without RadioCardGroup`  
**Good:** `<RadioCardGroup name="plan" label="Plan"><RadioCard value="pro" title="Pro" /></RadioCardGroup>`  
**Why:** RadioCard reads its name, selected value, and change handler from RadioCardGroup context; outside a group it has no shared name and cannot enforce single-selection

## Related components

- **Radio** (alternative): Use for plain text options without descriptions
- **CheckboxCard** (alternative): Use the card pattern when multiple selections are allowed
- **SegmentedControl** (alternative): Use for a compact inline single choice

## Accessibility rationale

Each card is a <label> wrapping a native <input type="radio"> and RadioCardGroup applies role="radiogroup" with an aria-label, so selection, arrow-key navigation, and label association come from the platform rather than custom click handling.

## Props

| Name          | Type        | Required | Default | Description          |
| ------------- | ----------- | -------- | ------- | -------------------- |
| `value`       | `string`    | Yes      | —       | Radio value          |
| `title`       | `ReactNode` | Yes      | —       | Card title           |
| `description` | `ReactNode` | No       | —       | Optional description |
| `disabled`    | `boolean`   | No       | —       | Disables the card    |

## Tokens

- `--cascivo-color-accent`
- `--cascivo-color-border`
- `--cascivo-radius-surface`
- `--cascivo-color-active-bg`

## Examples

### Plan selector

Single-select plan picker

```jsx
<RadioCardGroup name="plan" defaultValue="pro" label="Plan">
  <RadioCard value="free" title="Free" description="For hobbyists" />
  <RadioCard value="pro" title="Pro" description="For professionals" />
  <RadioCard value="team" title="Team" description="For teams" />
</RadioCardGroup>
```

## Boundaries

| Area                  | Level    | Note                                                                      |
| --------------------- | -------- | ------------------------------------------------------------------------- |
| token names           | strict   | Card and indicator styling must resolve to the listed --cascivo-\* tokens |
| title and description | flexible | title and description accept arbitrary ReactNode content                  |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo RadioCard component (inputs). Selectable card backed by a native radio input. Use RadioCardGroup for single-select groups.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

RadioCard is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-accent, --cascivo-color-border, --cascivo-radius-surface, --cascivo-color-active-bg

Accessibility: role "radiogroup", WCAG 2.2-AA, keyboard: ArrowDown/ArrowUp/Space. Keep it AA.

Do not change (strict): token names — Card and indicator styling must resolve to the listed --cascivo-* tokens
Flexible: title and description.

Do not invent props, tokens, or global viewport media queries.
```
