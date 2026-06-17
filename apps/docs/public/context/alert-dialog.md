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

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-lg`
- `--cascivo-shadow-xl`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`
- `--cascivo-color-accent`
- `--cascivo-color-destructive`

## Boundaries

| Area | Level | Note |
|------|-------|------|
| dismiss behavior | strict | No light-dismiss — closing must go through onConfirm/onCancel |
| action labels | flexible | confirm/cancel copy overridable via labels; defaults come from the i18n catalog |
| token names | strict | Visual styling resolves to semantic --cascivo-color-* tokens; destructive variant uses --cascivo-color-destructive |
