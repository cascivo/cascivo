# Separator

**Category:** display  
**Description:** Visual or semantic divider between content

## When to use

- Dividing groups of content within a section or menu
- Adding a vertical rule between inline items (orientation="vertical")
- Marking a meaningful thematic break (decorative=false)

## When NOT to use

- Adding spacing only — use margin/padding, not a separator
- Bordering a container — use the container border, not a separator

## Anti-patterns

### Separators imply a content division; using them for spacing misleads assistive tech

**Bad:** `Multiple separators stacked to create whitespace`  
**Good:** `Use spacing tokens for gaps; one separator for a real break`  
**Why:** Separators imply a content division; using them for spacing misleads assistive tech

## Related components

- **Card** (contained-by): Often used to divide regions inside a Card

## Accessibility rationale

role="separator" when meaningful so screen readers announce the division; setting decorative hides it from the accessibility tree when it is purely visual

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `orientation` | `'horizontal' \| 'vertical'` | No | horizontal | Layout orientation of the component. |
| `decorative` | `boolean` | No | false | When true, the separator is purely visual and hidden from assistive tech |

## Tokens

- `--cascivo-color-border`

## Examples

### Horizontal

```jsx
<Separator />
```

### Vertical

```jsx
<Separator orientation="vertical" />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| decorative | flexible | Mark decorative when the break carries no meaning beyond visuals |
| token names | strict | Color must resolve to --cascivo-color-border |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Separator component (display). Visual or semantic divider between content

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Separator is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-border

Accessibility: role "separator", WCAG 2.2-AA. Keep it AA.

Do not change (strict): token names — Color must resolve to --cascivo-color-border
Flexible: decorative.

Do not invent props, tokens, or global viewport media queries.
```
