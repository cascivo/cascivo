# Drawer

Edge-anchored dialog panel that slides in from a screen edge with CSS-only enter/exit motion

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add drawer
```

Or use it from the prebuilt package without copying:

```tsx
import { Drawer } from '@cascivo/react'
```

## Category

`overlay`

## States

- `open`
- `closed`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `open` | `boolean` | no | — | Whether the component is open (controlled). |
| `defaultOpen` | `boolean` | no | — | Whether the component is open on first render (uncontrolled). |
| `onOpenChange` | `(open: boolean) => void` | no | — | Called with the next open state when it changes. |
| `side` | `'start' \| 'end' \| 'top' \| 'bottom'` | no | `end` | Edge the panel is anchored to. Drives the slide direction. |
| `size` | `string` | no | — | Panel size along its cross axis (width for start/end, height for top/bottom). |
| `title` | `React.ReactNode` | no | — | Title text for the component. |
| `description` | `React.ReactNode` | no | — | Supporting description text. |
| `children` | `React.ReactNode` | no | — | Content rendered inside the component. |
| `labels` | `{ close?: string }` | no | — | Overrides for the component’s user-visible strings (i18n). |
| `className` | `string` | no | — | Additional CSS class names merged onto the root element. |
| `swipeToDismiss` | `boolean` | no | `false` | Allow dragging the header toward its edge to dismiss (opt-in). |

## Examples

### Basic

```tsx
<Drawer open={isOpen} onOpenChange={setIsOpen} title="Settings">
  <SettingsForm />
</Drawer>
```

### Bottom drawer with swipe-to-dismiss

Dragging the header past a threshold toward the edge dismisses the panel.

```tsx
<Drawer defaultOpen side="bottom" size="20rem" swipeToDismiss title="Details">
  <OrderDetails />
</Drawer>
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-overlay`
- `--cascivo-shadow-overlay`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `dialog`
- **Keyboard:** Escape, Tab, Shift+Tab

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

overlay, drawer, panel, slide, dialog
