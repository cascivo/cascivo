# Accordion

**Category:** navigation  
**Description:** Vertically stacked, collapsible content sections

## When to use

- Progressively disclosing sections of related content the user reads top to bottom
- Reducing vertical scroll when most sections stay collapsed (FAQs, settings groups)
- Allowing multiple sections open at once (type="multiple")

## When NOT to use

- Switching between mutually exclusive, equally important views — use Tabs
- A single show/hide region — a plain disclosure is enough

## Anti-patterns

### A single permanently-open section adds chrome and indirection for no gain

**Bad:** `<Accordion> with one item that is always open`  
**Good:** `Render the content directly, or use a collapsible disclosure`  
**Why:** A single permanently-open section adds chrome and indirection for no gain

## Related components

- **Tabs** (alternative): Tabs switch between peer views; Accordion stacks sequential sections vertically

## Accessibility rationale

Each trigger is a native <button> exposing aria-expanded and controlling its panel via aria-controls, so screen readers announce open/closed state and Enter/Space toggle from the platform

## Props

| Name            | Type            | Required           | Default | Description |
| --------------- | --------------- | ------------------ | ------- | ----------- | -------------------------------------------------------------- | ------------ |
| `type`          | `'single'       | 'multiple'`        | No      | single      | Whether one or multiple sections can be open at once ('single' | 'multiple'). |
| `defaultValue`  | `string         | string[]`          | No      | —           | The initial value when uncontrolled.                           |
| `value`         | `string         | string[]`          | No      | —           | The controlled value.                                          |
| `onValueChange` | `(value: string | string[]) => void` | No      | —           | Called with the new value when it changes.                     |

## Tokens

- `--cascivo-color-border`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-text`
- `--cascivo-radius-md`
- `--cascivo-focus-ring`

## Examples

### Single

```jsx
<Accordion type="single" defaultValue="a">
  <AccordionItem value="a">
    <AccordionTrigger>Section</AccordionTrigger>
    <AccordionContent>…</AccordionContent>
  </AccordionItem>
</Accordion>
```

## Boundaries

| Area               | Level    | Note                                                                      |
| ------------------ | -------- | ------------------------------------------------------------------------- |
| single vs multiple | flexible | type prop is free to choose based on whether sections are exclusive       |
| token names        | strict   | Borders, surfaces, and radii must resolve to --cascivo-\* semantic tokens |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Accordion component (navigation). Vertically stacked, collapsible content sections

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Accordion is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-border, --cascivo-color-bg-subtle, --cascivo-color-text, --cascivo-radius-md, --cascivo-focus-ring

Accessibility: role "button", WCAG 2.2-AA, keyboard: Enter/Space. Keep it AA.

Do not change (strict): token names — Borders, surfaces, and radii must resolve to --cascivo-* semantic tokens
Flexible: single vs multiple.

Do not invent props, tokens, or global viewport media queries.
```
