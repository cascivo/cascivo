# RatingGroup

**Category:** inputs  
**Description:** Star rating input with accessible radio group pattern

## When to use

- Capturing a discrete subjective rating on a small fixed scale (e.g. 1–5 stars)
- Displaying an existing rating read-only as a compact star summary

## When NOT to use

- Choosing along a continuous or large numeric range — use Slider
- Entering an exact bounded number with steppers — use NumberInput
- A non-rating single choice among labeled options — use Radio or SegmentedControl

## Anti-patterns

### A slider communicates a continuous magnitude; RatingGroup uses radio semantics so each star is an exclusive discrete choice announced as "N of M stars"

**Bad:** `<Slider min={1} max={5} step={1} /> labeled as a star rating`  
**Good:** `<RatingGroup value={rating} onValueChange={setRating} />`  
**Why:** A slider communicates a continuous magnitude; RatingGroup uses radio semantics so each star is an exclusive discrete choice announced as "N of M stars"

## Related components

- **Slider** (alternative): Use for continuous or larger numeric ranges
- **NumberInput** (alternative): Use when an exact typed number is needed rather than a rating

## Accessibility rationale

Each star is a <button role="radio"> inside a role="radiogroup" with aria-checked on the selected value and an aria-label like "3 of 5 stars"; when readOnly or disabled the stars drop out of the tab order so a non-interactive rating is not announced as actionable.

## Props

| Name            | Type                  | Required | Default | Description                                                        |
| --------------- | --------------------- | -------- | ------- | ------------------------------------------------------------------ | --- | ----------------------------------------------------- |
| `value`         | `number`              | Yes      | —       | The controlled value.                                              |
| `onValueChange` | `(v: number) => void` | No       | —       | Called with the new value when it changes.                         |
| `max`           | `number`              | No       | 5       | Maximum allowed value.                                             |
| `size`          | `'sm'                 | 'md'     | 'lg'`   | No                                                                 | md  | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `disabled`      | `boolean`             | No       | false   | When true, disables the control and removes it from the tab order. |
| `readOnly`      | `boolean`             | No       | false   | When true, the value is shown but cannot be edited.                |
| `labels`        | `RatingGroupLabels`   | No       | —       | Overrides for the component’s user-visible strings (i18n).         |

## Tokens

- `--cascivo-color-warning`
- `--cascivo-color-border-strong`
- `--cascivo-color-accent`
- `--cascivo-radius-sm`

## Examples

### Basic

```jsx
<RatingGroup value={3} onValueChange={() => {}} />
```

### Read only

```jsx
<RatingGroup value={4} readOnly />
```

## Boundaries

| Area             | Level    | Note                                                                      |
| ---------------- | -------- | ------------------------------------------------------------------------- |
| token names      | strict   | Star styling must resolve to the listed --cascivo-\* tokens               |
| scale and labels | flexible | max sets the scale and labels.rating customizes the per-star announcement |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo RatingGroup component (inputs). Star rating input with accessible radio group pattern

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

RatingGroup is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-warning, --cascivo-color-border-strong, --cascivo-color-accent, --cascivo-radius-sm

Accessibility: role "radiogroup", WCAG 2.2-AA, keyboard: Tab/Space/Enter. Keep it AA.

Do not change (strict): token names — Star styling must resolve to the listed --cascivo-* tokens
Flexible: scale and labels.

Do not invent props, tokens, or global viewport media queries.
```
