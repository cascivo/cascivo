# HeaderPanel

Non-modal panel anchored below the shell header at the inline-end edge — hosts notifications, app switcher, user settings

## Install

```bash
npx cascade add header-panel
```

## Category

`navigation`

## States

- `open`
- `closed`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `open` | `boolean` | yes | — | Controlled open state |
| `onClose` | `() => void` | yes | — | Called on close button click or light-dismiss |
| `label` | `string` | yes | — | Accessible label for the region (shown as header title) |
| `children` | `ReactNode` | yes | — | — |
| `labels` | `HeaderPanelLabels` | no | — | i18n overrides |
| `className` | `string` | no | — | — |

## Examples

### Notification panel

Pair with a ShellHeader action: action active=open, onAction toggles open

```tsx
<HeaderPanel open={open} onClose={() => setOpen(false)} label="Notifications">
  <p>3 unread messages</p>
</HeaderPanel>
```

## Design tokens

- `--cascade-shell-header-block-size`
- `--cascade-shell-panel-inline-size`
- `--cascade-color-surface`
- `--cascade-color-border`
- `--cascade-shadow-md`
- `--cascade-motion-enter`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `region`
- **Keyboard:** Escape, Tab

## Dependencies

- `@cascade-ui/core`
- `@cascade-ui/i18n`

## Tags

navigation, panel, shell, console, overlay, notifications
