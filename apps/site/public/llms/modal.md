# Modal

Accessible dialog overlay using native <dialog> element

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add modal
```

Or use it from the prebuilt package without copying:

```tsx
import { Modal } from '@cascivo/react'
```

## Category

`overlay`

## Sizes

- `sm`
- `md`
- `lg`

## States

- `closed`
- `open`

## Props

| Prop          | Type                   | Required | Default | Description                                           |
| ------------- | ---------------------- | -------- | ------- | ----------------------------------------------------- |
| `open`        | `boolean`              | no       | `false` | Whether the component is open (controlled).           |
| `onClose`     | `() => void`           | no       | —       | Called when the component is closed.                  |
| `title`       | `string`               | no       | —       | Title text for the component.                         |
| `description` | `string`               | no       | —       | Supporting description text.                          |
| `size`        | `'sm' \| 'md' \| 'lg'` | no       | `md`    | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `draggable`   | `boolean`              | no       | `false` | Allow dragging the dialog by its header               |

## Examples

### Basic modal

```tsx
<Modal open={isOpen} onClose={() => setIsOpen(false)} title="Confirm action">
  <p>Are you sure?</p>
</Modal>
```

## Design tokens

- `--cascivo-color-surface-overlay`
- `--cascivo-color-border`
- `--cascivo-radius-modal`
- `--cascivo-shadow-xl`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `dialog`
- **Keyboard:** Escape, Tab, Shift+Tab

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

overlay, dialog, popup

---

_Generated from registry v0.8.0 on 2026-07-21. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
