# Card

**Category:** display  
**Description:** Container for grouping related content

## When to use

- Grouping related content into a visually distinct surface with border/shadow
- Creating scannable units in a grid or list (dashboard tiles, item summaries)
- Giving a content cluster elevation to separate it from the page background

## When NOT to use

- Pure semantic/structural grouping with no surface — use a <section>
- Wrapping every element in a card — nesting surfaces flattens visual hierarchy

## Anti-patterns

### Stacked surfaces and shadows compete for attention and muddy the hierarchy

**Bad:** `Nesting Cards several levels deep for layout`  
**Good:** `A single Card with internal spacing, or a plain <section>`  
**Why:** Stacked surfaces and shadows compete for attention and muddy the hierarchy

## Related components

- **Separator** (pairs-with): Use a Separator to divide regions inside a card

## Accessibility rationale

role="region" is appropriate only when the card is a meaningful landmark; otherwise treat it as presentational — the visual surface adds no semantics on its own

## Props

| Name      | Type       | Required   | Default     | Description |
| --------- | ---------- | ---------- | ----------- | ----------- | ------- | --- | --- |
| `variant` | `'default' | 'outlined' | 'elevated'` | No          | default | —   |
| `padding` | `'none'    | 'sm'       | 'md'        | 'lg'`       | No      | md  | —   |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-card`
- `--cascivo-shadow-md`

## Examples

### Basic card

```jsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

## Boundaries

| Area                | Level    | Note                                                                    |
| ------------------- | -------- | ----------------------------------------------------------------------- |
| variant and padding | flexible | Choose elevation and density to fit the surrounding layout              |
| token names         | strict   | Surface, border, radius, and shadow must resolve to --cascivo-\* tokens |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Card component (display). Container for grouping related content

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Card is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-border, --cascivo-radius-card, --cascivo-shadow-md

Accessibility: role "region", WCAG 2.2-AA. Keep it AA.

Do not change (strict): token names — Surface, border, radius, and shadow must resolve to --cascivo-* tokens
Flexible: variant and padding.

Do not invent props, tokens, or global viewport media queries.
```
