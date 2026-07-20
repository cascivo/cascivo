# Toast

Transient notification surfaced via the useToast hook

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add toast
```

Or use it from the prebuilt package without copying:

```tsx
import { ToastProvider, useToast } from '@cascivo/react'
```

## Category

`overlay`

## Variants

- `default`
- `success`
- `warning`
- `destructive`

## States

- `visible`
- `dismissing`
- `gone`

## Props

| Prop          | Type                                                   | Required | Default   | Description                                                |
| ------------- | ------------------------------------------------------ | -------- | --------- | ---------------------------------------------------------- |
| `title`       | `string`                                               | yes      | —         | Title text for the component.                              |
| `description` | `string`                                               | no       | —         | Supporting description text.                               |
| `variant`     | `'default' \| 'success' \| 'warning' \| 'destructive'` | no       | `default` | Selects the visual style variant.                          |
| `duration`    | `number`                                               | no       | `5000`    | How long (ms) the toast stays visible before auto-dismiss. |

## Examples

### Trigger

```tsx
const { toast } = useToast()
toast({ title: 'Saved', variant: 'success' })
```

## Design tokens

- `--cascivo-color-surface-overlay`
- `--cascivo-color-success`
- `--cascivo-color-warning`
- `--cascivo-color-destructive`
- `--cascivo-radius-md`
- `--cascivo-z-toast`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `status`
- **Keyboard:** Tab

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

overlay, notification, feedback

---

_Generated from registry v0.8.0 on 2026-07-20. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
