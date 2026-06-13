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
| `title` | `string` | Yes | — | — |
| `description` | `string` | No | — | — |
| `variant` | `'default' | 'success' | 'warning' | 'destructive'` | No | default | — |
| `duration` | `number` | No | 5000 | — |

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
| variant | strict | Limited to default | success | warning | destructive — drives color and live-region urgency |
| duration | flexible | Consumer can tune auto-dismiss timing (default 5000ms) |
