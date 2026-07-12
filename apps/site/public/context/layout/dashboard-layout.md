# DashboardLayout

**Category:** layout  
**Description:** Dashboard page layout with stats strip, main content area, and optional aside.

## When to use

- A dashboard page with a stats strip, main content area, and optional aside
- Composing KPI tiles and charts into a standard analytics layout

## When NOT to use

- A bare app frame without dashboard structure — use AppShell
- A simple form or content page — use Section or SettingsLayout

## Related components

- **AppShell** (alternative): Use the bare shell when you do not need dashboard structure
- **StatsCards** (contains): KPI cards commonly fill the stats strip

## Accessibility rationale

Provides landmark regions for main content and complementary aside.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `stats` | `ReactNode` | No | — | Stats/KPI row (auto-fit grid) |
| `main` | `ReactNode` | Yes | — | Main content area |
| `aside` | `ReactNode` | No | — | Optional aside panel (20rem) |

## Tokens

- `--cascivo-space-4`
- `--cascivo-space-6`

## Examples

### With stats

Stats + main layout

```jsx
<DashboardLayout stats={<div>KPIs</div>} main={<div>Content</div>} />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo DashboardLayout component (layout). Dashboard page layout with stats strip, main content area, and optional aside.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

DashboardLayout is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-space-4, --cascivo-space-6

Accessibility: role "generic", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
