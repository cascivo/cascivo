# EmptyDashboard

**Category:** display  
**Description:** Dashboard page showing an empty state with a call-to-action button.

## When to use

- A first-run or zero-data dashboard with an empty state and primary CTA
- Guiding users to create their first item

## When NOT to use

- Data already exists — use DashboardCharts or DashboardLayout
- A generic empty state inside a component — use an inline EmptyState

## Related components

- **DashboardCharts** (alternative): Use once the dashboard has data to display

## Accessibility rationale

Provides a main landmark with a clear heading and actionable CTA.

## Props

| Name           | Type         | Required | Default | Description                |
| -------------- | ------------ | -------- | ------- | -------------------------- |
| `onCreateItem` | `() => void` | No       | —       | Create item button handler |

## Examples

### Default

Empty dashboard

```jsx
<EmptyDashboard />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo EmptyDashboard component (display). Dashboard page showing an empty state with a call-to-action button.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

EmptyDashboard is strictly bound to these tokens — use only these, do not invent token names:
  none declared

Accessibility: role "generic", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
