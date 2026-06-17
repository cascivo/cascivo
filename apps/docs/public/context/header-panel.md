# HeaderPanel

**Category:** navigation  
**Description:** Non-modal panel anchored below the shell header at the inline-end edge — hosts notifications, app switcher, user settings

## When to use

- Hosting a non-modal panel anchored under the shell header (notifications, switcher, settings)
- Showing supplementary content triggered by a ShellHeader icon action
- Light-dismiss content that should not block the rest of the app

## When NOT to use

- Content that must block interaction until resolved — use Modal
- A small contextual menu attached to a trigger — use Dropdown or Popover

## Anti-patterns

### HeaderPanel is non-modal and light-dismissable; blocking flows need modal semantics

**Bad:** `Using HeaderPanel for a blocking confirmation`  
**Good:** `<Modal> or <AlertDialog> for decisions that must block`  
**Why:** HeaderPanel is non-modal and light-dismissable; blocking flows need modal semantics

## Related components

- **ShellHeader** (pairs-with): Opened by a ShellHeader action whose active state mirrors the panel open state
- **Switcher** (contains): A Switcher commonly lives inside a HeaderPanel

## Accessibility rationale

role="region" with the label prop names the panel as a landmark; Escape closes it and focus is managed so keyboard users can dismiss it without a mouse

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `open` | `boolean` | Yes | — | Controlled open state |
| `onClose` | `() => void` | Yes | — | Called on close button click or light-dismiss |
| `label` | `string` | Yes | — | Accessible label for the region (shown as header title) |
| `children` | `ReactNode` | Yes | — | — |
| `labels` | `HeaderPanelLabels` | No | — | i18n overrides |
| `className` | `string` | No | — | — |

## Tokens

- `--cascivo-shell-header-block-size`
- `--cascivo-shell-panel-inline-size`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-shadow-md`
- `--cascivo-motion-enter`

## Examples

### Notification panel

Pair with a ShellHeader action: action active=open, onAction toggles open

```jsx
<HeaderPanel open={open} onClose={() => setOpen(false)} label="Notifications">
  <p>3 unread messages</p>
</HeaderPanel>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| content | flexible | Children are arbitrary panel content |
| token names | strict | Surface, shadow, and sizing must resolve to --cascivo-* shell tokens |
