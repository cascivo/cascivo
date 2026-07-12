# PageHeader

**Category:** layout  
**Description:** Page-level header with title, description, breadcrumb, and actions slots.

## When to use

- A page-level header with title, description, breadcrumb, and action slots
- Establishing consistent page tops across an application

## When NOT to use

- A marketing hero with large media — use Hero
- A full app top bar with navigation — use AppShell

## Related components

- **Hero** (alternative): Use the marketing hero for landing-page tops
- **Section** (pairs-with): Place sections below the header to build out the page

## Accessibility rationale

Renders a header region with a top-level heading for screen reader page structure.

## Props

| Name          | Type        | Required | Default | Description            |
| ------------- | ----------- | -------- | ------- | ---------------------- |
| `title`       | `string`    | Yes      | —       | Page title             |
| `description` | `string`    | No       | —       | Supporting description |
| `breadcrumb`  | `ReactNode` | No       | —       | Breadcrumb slot        |
| `actions`     | `ReactNode` | No       | —       | Action buttons slot    |
| `className`   | `string`    | No       | —       | Additional CSS class   |

## Tokens

- `--cascivo-space-2`
- `--cascivo-space-4`
- `--cascivo-font-size-2xl`
- `--cascivo-font-weight-bold`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-font-size-sm`

## Examples

### Basic

Title with description

```jsx
<PageHeader title="Dashboard" description="Welcome back" />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo PageHeader component (layout). Page-level header with title, description, breadcrumb, and actions slots.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

PageHeader is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-space-2, --cascivo-space-4, --cascivo-font-size-2xl, --cascivo-font-weight-bold, --cascivo-color-text, --cascivo-color-text-muted, --cascivo-font-size-sm

Accessibility: role "banner", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
