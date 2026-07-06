# AlertDialog

**Category:** overlay  
**Description:** Confirmation dialog requiring explicit user action; no light-dismiss

## When to use

- Confirming a destructive or irreversible action (delete, overwrite, sign out) before it happens
- Interrupting a flow to force an explicit decision the user must acknowledge

## When NOT to use

- Showing non-critical information or forms — use Modal, which supports light-dismiss and arbitrary content
- Confirming a low-stakes action where an undoable Toast is friendlier and less interruptive

## Anti-patterns

### AlertDialog only renders a title, description, and two action buttons, and is role="alertdialog" with no light-dismiss — it is built to demand a yes/no answer, not host content

**Bad:** `Using AlertDialog for a multi-field form or rich content`  
**Good:** `Use Modal for content; reserve AlertDialog for a title + description + confirm/cancel decision`  
**Why:** AlertDialog only renders a title, description, and two action buttons, and is role="alertdialog" with no light-dismiss — it is built to demand a yes/no answer, not host content

### It uses popover="manual" so it cannot be light-dismissed by design — closing must go through onConfirm/onCancel so the decision is always explicit

**Bad:** `Adding a backdrop/Escape close to dismiss the dialog without choosing`  
**Good:** `undefined`  
**Why:** It uses popover="manual" so it cannot be light-dismissed by design — closing must go through onConfirm/onCancel so the decision is always explicit

## Related components

- **Modal** (alternative): Use for general dialogs with content and light-dismiss; AlertDialog is the must-acknowledge confirm
- **Toast** (alternative): Prefer an undoable Toast for reversible low-stakes actions instead of a blocking confirm
- **Button** (pairs-with): A Button typically triggers the action that opens the AlertDialog

## Accessibility rationale

Uses role="alertdialog" with aria-modal and labelled/described-by wiring so assistive tech announces it as an interruptive decision; focus moves to the cancel button on open so the safe default is selected, and popover="manual" prevents accidental dismissal that would skip the decision

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `open` | `boolean` | Yes | — | Whether the component is open (controlled). |
| `title` | `string` | Yes | — | Title text for the component. |
| `description` | `string` | Yes | — | Supporting description text. |
| `onConfirm` | `() => void` | Yes | — | Called when the confirm button is activated. |
| `onCancel` | `() => void` | Yes | — | Called when the cancel button is activated. |
| `labels` | `AlertDialogLabels` | No | — | Overrides for the component’s user-visible strings (i18n). |
| `variant` | `'destructive' \| 'default'` | No | default | Selects the visual style variant. |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-lg`
- `--cascivo-shadow-xl`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`
- `--cascivo-color-accent`
- `--cascivo-color-destructive`

## Examples

### Destructive confirm

```jsx
<AlertDialog
  open={isOpen}
  variant="destructive"
  title="Delete project?"
  description="This permanently removes the project and cannot be undone."
  onConfirm={remove}
  onCancel={() => setIsOpen(false)}
/>
```

### Custom action labels

```jsx
<AlertDialog
  open={isOpen}
  title="Sign out?"
  description="Unsaved changes will be lost."
  labels={{ confirm: 'Sign out', cancel: 'Stay' }}
  onConfirm={signOut}
  onCancel={() => setIsOpen(false)}
/>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| dismiss behavior | strict | No light-dismiss — closing must go through onConfirm/onCancel |
| action labels | flexible | confirm/cancel copy overridable via labels; defaults come from the i18n catalog |
| token names | strict | Visual styling resolves to semantic --cascivo-color-* tokens; destructive variant uses --cascivo-color-destructive |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo AlertDialog component (overlay). Confirmation dialog requiring explicit user action; no light-dismiss

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

AlertDialog is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-border, --cascivo-radius-lg, --cascivo-shadow-xl, --cascivo-motion-enter, --cascivo-motion-exit, --cascivo-color-accent, --cascivo-color-destructive

Accessibility: role "alertdialog", WCAG 2.2-AA, keyboard: Tab/Shift+Tab/Enter/Space. Keep it AA.

Do not change (strict): dismiss behavior — No light-dismiss — closing must go through onConfirm/onCancel; token names — Visual styling resolves to semantic --cascivo-color-* tokens; destructive variant uses --cascivo-color-destructive
Flexible: action labels.

Do not invent props, tokens, or global viewport media queries.
```
