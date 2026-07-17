# SidebarApp

**Category:** display  
**Description:** Full app shell with collapsible side navigation and top header.

## When to use

- A ready-made app shell with opinionated collapsible sidebar and top header
- Standing up an authenticated app frame quickly

## When NOT to use

- You want a bare shell to compose your own nav — use AppShell
- A dashboard-specific layout — use DashboardLayout

## Related components

- **AppShell** (alternative): Use the bare layout primitive for custom navigation
- **ConsoleApp** (alternative): Use the Carbon-parity console shell for icon-rail navigation

## Accessibility rationale

Provides header and navigation landmarks for screen reader orientation.

## Examples

### Default

App with sidebar navigation

```jsx
<SidebarApp />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo SidebarApp component (display). Full app shell with collapsible side navigation and top header.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

SidebarApp is strictly bound to these tokens — use only these, do not invent token names:
  none declared

Accessibility: role "generic", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
