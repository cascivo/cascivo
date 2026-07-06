# AuthLayout

**Category:** layout  
**Description:** Centered card layout for authentication pages (login, register, forgot password).

## When to use

- Centered card layout for authentication pages — login, register, reset
- Focused single-task pages with an optional logo and minimal chrome

## When NOT to use

- General centered content — use Center
- A full app frame after sign-in — use AppShell or SidebarApp

## Related components

- **LoginPage** (contains): The login page block renders inside this layout
- **Center** (alternative): Use for plain centering without the auth card framing

## Accessibility rationale

Provides a main landmark wrapping the focused auth content.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `ReactNode` | Yes | — | Auth form content |
| `logo` | `ReactNode` | No | — | Optional logo displayed above the form |

## Tokens

- `--cascivo-color-bg-subtle`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-lg`
- `--cascivo-space-4`
- `--cascivo-space-6`
- `--cascivo-space-8`

## Examples

### Login

Centered auth card with logo

```jsx
<AuthLayout logo={<img src="/logo.svg" alt="Logo" />}><form>...</form></AuthLayout>
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo AuthLayout component (layout). Centered card layout for authentication pages (login, register, forgot password).

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

AuthLayout is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-bg-subtle, --cascivo-color-surface, --cascivo-color-border, --cascivo-radius-lg, --cascivo-space-4, --cascivo-space-6, --cascivo-space-8

Accessibility: role "generic", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
