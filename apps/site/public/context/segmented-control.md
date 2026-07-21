# SegmentedControl

**Category:** inputs  
**Description:** Mutually exclusive toggle group

## When to use

- A compact inline single choice among a few mutually exclusive options (2–5) such as view modes or time ranges
- Switching between alternatives where all options should stay visible in a tight horizontal space

## When NOT to use

- Switching between full panels of page content — use Tabs
- A single binary on/off state — use Toggle
- More options than comfortably fit inline, or options needing descriptions — use Select or RadioCard

## Anti-patterns

### A pair of buttons does not convey exclusive selection; SegmentedControl uses radio semantics with aria-checked and arrow-key navigation so the single-choice state is announced

**Bad:** `Two <Button> elements toggling which is "active" via app state`  
**Good:** `<SegmentedControl options={[{label:"Day",value:"day"},{label:"Week",value:"week"}]} value={range} onValueChange={setRange} />`  
**Why:** A pair of buttons does not convey exclusive selection; SegmentedControl uses radio semantics with aria-checked and arrow-key navigation so the single-choice state is announced

## Related components

- **Toggle** (alternative): Use for a single binary on/off state, not a multi-option choice
- **Radio** (alternative): Use for a vertical or longer single-choice list with plain labels
- **Select** (alternative): Use when there are too many options to show inline

## Accessibility rationale

Wraps role="radio" buttons in a role="group" with aria-checked marking the selected segment, and ArrowLeft/ArrowRight move selection across enabled segments (skipping disabled ones) so keyboard users get standard single-choice navigation.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `options` | `SegmentedControlOption[]` | Yes | — | The selectable options. |
| `value` | `string` | Yes | — | The controlled value. |
| `onValueChange` | `(v: string) => void` | Yes | — | Called with the new value when it changes. |
| `size` | `'sm' \| 'md' \| 'lg'` | No | md | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `disabled` | `boolean` | No | false | When true, disables the control and removes it from the tab order. |

## Tokens

- `--cascivo-color-bg-subtle`
- `--cascivo-color-border`
- `--cascivo-color-surface`
- `--cascivo-color-text`
- `--cascivo-radius-md`
- `--cascivo-radius-sm`
- `--cascivo-shadow-sm`

## Examples

### Basic

```jsx
<SegmentedControl options={[{label:'Day',value:'day'},{label:'Week',value:'week'},{label:'Month',value:'month'}]} value="day" onValueChange={() => {}} />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| token names | strict | Segment styling must resolve to the listed --cascivo-* tokens |
| option labels | flexible | option label and value are free, and individual options may be disabled |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo SegmentedControl component (inputs). Mutually exclusive toggle group

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

SegmentedControl is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-bg-subtle, --cascivo-color-border, --cascivo-color-surface, --cascivo-color-text, --cascivo-radius-md, --cascivo-radius-sm, --cascivo-shadow-sm

Accessibility: role "group", WCAG 2.2-AA, keyboard: ArrowLeft/ArrowRight. Keep it AA.

Do not change (strict): token names — Segment styling must resolve to the listed --cascivo-* tokens
Flexible: option labels.

Do not invent props, tokens, or global viewport media queries.
```
