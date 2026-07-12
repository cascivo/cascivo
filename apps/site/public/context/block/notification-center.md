# NotificationCenter

**Category:** display  
**Description:** A list of notification alerts with a mark-all-read action.

## When to use

- A list of notification alerts with a mark-all-read action
- An inbox or activity panel surfaced from a header bell

## When NOT to use

- Transient feedback after an action — use a Toast
- A single inline status message — use an Alert

## Related components

- **Alert** (contains): Each notification is rendered as an alert item

## Accessibility rationale

Notification items use alert semantics so screen readers announce new entries.

## Props

| Name            | Type             | Required | Default | Description                   |
| --------------- | ---------------- | -------- | ------- | ----------------------------- |
| `notifications` | `Notification[]` | No       | —       | Notification items to display |
| `onMarkAllRead` | `() => void`     | No       | —       | Mark all read button handler  |

## Examples

### Default

Notification center

```jsx
<NotificationCenter />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo NotificationCenter component (display). A list of notification alerts with a mark-all-read action.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

NotificationCenter is strictly bound to these tokens — use only these, do not invent token names:
  none declared

Accessibility: role "generic", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
