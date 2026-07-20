# AlertDialog

Confirmation dialog requiring explicit user action; no light-dismiss

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add alert-dialog
```

Or use it from the prebuilt package without copying:

```tsx
import { AlertDialog } from '@cascivo/react'
```

## Category

`overlay`

## Variants

- `default`
- `destructive`

## States

- `open`
- `closed`

## Props

| Prop          | Type                         | Required | Default   | Description                                                |
| ------------- | ---------------------------- | -------- | --------- | ---------------------------------------------------------- |
| `open`        | `boolean`                    | yes      | —         | Whether the component is open (controlled).                |
| `title`       | `string`                     | yes      | —         | Title text for the component.                              |
| `description` | `string`                     | yes      | —         | Supporting description text.                               |
| `onConfirm`   | `() => void`                 | yes      | —         | Called when the confirm button is activated.               |
| `onCancel`    | `() => void`                 | yes      | —         | Called when the cancel button is activated.                |
| `labels`      | `AlertDialogLabels`          | no       | —         | Overrides for the component’s user-visible strings (i18n). |
| `variant`     | `'destructive' \| 'default'` | no       | `default` | Selects the visual style variant.                          |

## Examples

### Destructive confirm

```tsx
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

```tsx
<AlertDialog
  open={isOpen}
  title="Sign out?"
  description="Unsaved changes will be lost."
  labels={{ confirm: 'Sign out', cancel: 'Stay' }}
  onConfirm={signOut}
  onCancel={() => setIsOpen(false)}
/>
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-lg`
- `--cascivo-shadow-xl`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`
- `--cascivo-color-accent`
- `--cascivo-color-destructive`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `alertdialog`
- **Keyboard:** Tab, Shift+Tab, Enter, Space

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

overlay, dialog, confirm, destructive

---

_Generated from registry v0.8.0 on 2026-07-20. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
