# Radio

**Category:** inputs  
**Description:** Single choice from a set, grouped with RadioGroup

## When to use

- Choosing exactly one option from a small, mutually exclusive set (roughly 2–6) where all options should stay visible
- Form fields where the choices need plain text labels and a familiar radio affordance

## When NOT to use

- Selecting one of many options where showing them all is impractical — use Select
- Each option needs a title plus description or richer layout — use RadioCard
- A compact inline switch between a few views or modes — use SegmentedControl

## Anti-patterns

### Checkboxes imply multi-select; a radio group communicates and enforces single-choice semantics to assistive tech

**Bad:** `Multiple <Checkbox> where only one may be selected`  
**Good:** `<RadioGroup name="plan"><Radio value="pro" label="Pro" /><Radio value="team" label="Team" /></RadioGroup>`  
**Why:** Checkboxes imply multi-select; a radio group communicates and enforces single-choice semantics to assistive tech

## Related components

- **RadioCard** (alternative): Use when each option needs a title, description, or card layout
- **SegmentedControl** (alternative): Use for a compact inline single choice among a few options
- **Select** (alternative): Use when there are too many options to show inline

## Accessibility rationale

Each Radio is a native <input type="radio"> wrapped in a <label>, and RadioGroup applies role="radiogroup" with a shared name so the browser provides roving arrow-key navigation, single-selection, and label association for free.

## Props

| Name       | Type      | Required | Default | Description |
| ---------- | --------- | -------- | ------- | ----------- |
| `label`    | `string`  | No       | —       | —           |
| `value`    | `string`  | Yes      | —       | —           |
| `disabled` | `boolean` | No       | false   | —           |
| `name`     | `string`  | No       | —       | —           |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-accent`
- `--cascivo-color-border-strong`
- `--cascivo-color-text-on-accent`
- `--cascivo-radius-full`
- `--cascivo-focus-ring`

## Examples

### Group

```jsx
<RadioGroup name="plan" defaultValue="pro">
  <Radio value="pro" label="Pro" />
  <Radio value="team" label="Team" />
</RadioGroup>
```

## Boundaries

| Area                          | Level    | Note                                                                           |
| ----------------------------- | -------- | ------------------------------------------------------------------------------ |
| token names                   | strict   | Control and label styling must resolve to the listed --cascivo-\* tokens       |
| option labels and orientation | flexible | Labels are free text and the group supports horizontal or vertical orientation |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Radio component (inputs). Single choice from a set, grouped with RadioGroup

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Radio is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-accent, --cascivo-color-border-strong, --cascivo-color-text-on-accent, --cascivo-radius-full, --cascivo-focus-ring

Accessibility: role "radio", WCAG 2.2-AA, keyboard: ArrowUp/ArrowDown/ArrowLeft/ArrowRight/Space. Keep it AA.

Do not change (strict): token names — Control and label styling must resolve to the listed --cascivo-* tokens
Flexible: option labels and orientation.

Do not invent props, tokens, or global viewport media queries.
```
