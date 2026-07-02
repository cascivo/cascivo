# PageWithBreadcrumb

**Category:** display  
**Description:** A centered content page with a breadcrumb navigation and page header.

## When to use

- A centered content page with breadcrumb navigation and a page header
- Deep pages where users need hierarchical context

## When NOT to use

- Top-level pages with no hierarchy to express
- You only need the header without breadcrumbs — use PageHeader

## Related components

- **PageHeader** (contains): Uses a page header with a breadcrumb slot

## Accessibility rationale

Breadcrumb renders as a labeled navigation region for screen reader orientation.

## Examples

### Default

Page with breadcrumb

```jsx
<PageWithBreadcrumb />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo PageWithBreadcrumb component (display). A centered content page with a breadcrumb navigation and page header.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

PageWithBreadcrumb is strictly bound to these tokens — use only these, do not invent token names:
  none declared

Accessibility: role "generic", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
