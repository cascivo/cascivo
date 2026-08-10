# VisuallyHidden

**Category:** display  
**Description:** Hides content visually while keeping it available to screen readers

## When to use

- Giving an icon-only control an accessible name without showing text
- Adding screen-reader-only context that would be redundant visually
- Providing off-screen labels for tables, links, or form controls

## When NOT to use

- Hiding content from everyone — use hidden or display:none
- Temporarily hiding then revealing UI — use conditional rendering

## Anti-patterns

### VisuallyHidden keeps content in the accessibility tree — using it to hide noise pollutes screen-reader output

**Bad:** `Wrapping decorative content in VisuallyHidden to "clean up" the layout`  
**Good:** `aria-hidden on decorative elements; VisuallyHidden only for content screen readers need`  
**Why:** VisuallyHidden keeps content in the accessibility tree — using it to hide noise pollutes screen-reader output

## Related components

- **SkipNav** (alternative): SkipNav uses a similar hidden-until-focused technique for skip links

## Accessibility rationale

Applies the standard clip technique so content stays in the DOM and accessibility tree while being painted off-screen — assistive tech reads it, sighted users do not see it

## Props

| Name       | Type        | Required | Default | Description                                               |
| ---------- | ----------- | -------- | ------- | --------------------------------------------------------- |
| `children` | `ReactNode` | Yes      | —       | Content announced by assistive technology but not painted |

## Examples

### Icon button label

Gives an icon-only control an accessible name

```jsx
<button type="button">
  <CloseIcon />
  <VisuallyHidden>Close dialog</VisuallyHidden>
</button>
```

### Table context

```jsx
<th>
  Price <VisuallyHidden>(in euros)</VisuallyHidden>
</th>
```

## Boundaries

| Area                 | Level    | Note                                                    |
| -------------------- | -------- | ------------------------------------------------------- |
| children             | flexible | Any text/content meant for assistive tech               |
| visibility technique | strict   | Must keep content in the a11y tree — never display:none |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo VisuallyHidden component (display). Hides content visually while keeping it available to screen readers

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

VisuallyHidden is strictly bound to these tokens — use only these, do not invent token names:
  none declared

Accessibility: role "none", WCAG 2.2-AA. Keep it AA.

Do not change (strict): visibility technique — Must keep content in the a11y tree — never display:none
Flexible: children.

Do not invent props, tokens, or global viewport media queries.
```
