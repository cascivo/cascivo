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

| Prop          | Type                   | Required | Default | Description                                                                                |
| ------------- | ---------------------- | -------- | ------- | ------------------------------------------------------------------------------------------ |
| `open`        | `boolean`              | no       | `false` | Whether the component is open (controlled).                                                |
| `onClose`     | `() => void`           | no       | —       | Called when the component is closed.                                                       |
| `title`       | `string`               | no       | —       | Title text for the component.                                                              |
| `description` | `string`               | no       | —       | Supporting description text.                                                               |
| `size`        | `'sm' \| 'md' \| 'lg'` | no       | `md`    | Visual size of the component (e.g. 'sm', 'md', 'lg').                                      |
| `footer`      | `ReactNode`            | no       | —       | Dialog actions, rendered in a right-aligned row below the body and separated by a divider. |
| `draggable`   | `boolean`              | no       | `false` | Allow dragging the dialog by its header                                                    |

## Examples

### Basic modal

```tsx
<Modal open={isOpen} onClose={() => setIsOpen(false)} title="Confirm action">
  <p>Are you sure?</p>
</Modal>
```

## Client JavaScript

Required. Without client JavaScript this renders nothing useful, or a shell whose content is unreachable.

## Design tokens

- `--cascivo-color-surface-overlay`
- `--cascivo-color-border`
- `--cascivo-radius-modal`
- `--cascivo-shadow-xl`
- `--cascivo-focus-ring`
- `--cascivo-dialog-body-gap`

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

_Generated from registry v0.14.0 on 2026-07-31. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
