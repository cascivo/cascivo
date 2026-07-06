# Toast

**Category:** overlay  
**Description:** Transient notification surfaced via the useToast hook

## When to use

- Confirming that a background or just-completed action succeeded or failed (e.g. "Saved")
- Brief, transient feedback that should auto-dismiss without interrupting the task
- Non-blocking notifications that can stack and disappear on their own

## When NOT to use

- A persistent, inline message tied to a specific region of the page — use Alert
- Feedback that requires the user to acknowledge or decide before continuing — use Modal or AlertDialog

## Anti-patterns

### Toasts auto-dismiss and are easy to miss; a destructive decision needs a blocking dialog the user must confirm

**Bad:** `toast({ title: "Delete this account?", duration: 0 })`  
**Good:** `<AlertDialog title="Delete this account?" />`  
**Why:** Toasts auto-dismiss and are easy to miss; a destructive decision needs a blocking dialog the user must confirm

## Related components

- **Alert** (alternative): Use for persistent inline status that stays until resolved
- **Modal** (alternative): Use when the user must acknowledge before proceeding

## Accessibility rationale

Toasts render into a labelled region; non-critical ones use role="status" with aria-live="polite", while destructive variants escalate to role="alert" with aria-live="assertive" so urgency is conveyed without stealing focus.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | Yes | — | Title text for the component. |
| `description` | `string` | No | — | Supporting description text. |
| `variant` | `'default' \| 'success' \| 'warning' \| 'destructive'` | No | default | Selects the visual style variant. |
| `duration` | `number` | No | 5000 | How long (ms) the toast stays visible before auto-dismiss. |

## Tokens

- `--cascivo-color-surface-overlay`
- `--cascivo-color-success`
- `--cascivo-color-warning`
- `--cascivo-color-destructive`
- `--cascivo-radius-md`
- `--cascivo-z-toast`

## Examples

### Trigger

```jsx
const { toast } = useToast()
toast({ title: "Saved", variant: "success" })
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| variant | strict | Limited to default \| success \| warning \| destructive — drives color and live-region urgency |
| duration | flexible | Consumer can tune auto-dismiss timing (default 5000ms) |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Toast component (overlay). Transient notification surfaced via the useToast hook

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Toast is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface-overlay, --cascivo-color-success, --cascivo-color-warning, --cascivo-color-destructive, --cascivo-radius-md, --cascivo-z-toast

Accessibility: role "status", WCAG 2.2-AA, keyboard: Tab. Keep it AA.

Do not change (strict): variant — Limited to default | success | warning | destructive — drives color and live-region urgency
Flexible: duration.

Do not invent props, tokens, or global viewport media queries.
```
