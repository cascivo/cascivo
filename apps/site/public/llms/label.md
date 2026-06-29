# Label

Accessible caption for a form control

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add label
```

Or use it from the prebuilt package without copying:

```tsx
import { Label } from '@cascivo/react'
```

## Category

`inputs`

## States

- `default`
- `disabled`

## Props

| Prop       | Type                    | Required | Default | Description                                                                                       |
| ---------- | ----------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------- |
| `htmlFor`  | `string`                | no       | —       | Id of the form control this label is associated with.                                             |
| `asChild`  | `boolean`               | no       | `false` | When true, renders the child element as the root via Slot, merging props (polymorphic rendering). |
| `required` | `boolean`               | no       | `false` | When true, marks the field as required.                                                           |
| `disabled` | `boolean`               | no       | `false` | When true, disables the control and removes it from the tab order.                                |
| `children` | `ReactNode`             | yes      | —       | Content rendered inside the component.                                                            |
| `labels`   | `{ required?: string }` | no       | —       | Overrides for the component’s user-visible strings (i18n).                                        |

## Examples

### Basic

```tsx
<Label htmlFor="email">Email</Label>
```

### Required

```tsx
<Label htmlFor="email" required>
  Email
</Label>
```

### asChild

Render the label semantics onto a custom element via Slot.

```tsx
<Label asChild htmlFor="email">
  <span>Email</span>
</Label>
```

## Design tokens

- `--cascivo-space-1`
- `--cascivo-font-sans`
- `--cascivo-text-sm`
- `--cascivo-font-medium`
- `--cascivo-leading-snug`
- `--cascivo-leading-none`
- `--cascivo-color-text`
- `--cascivo-color-destructive`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `label`

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

form, caption, accessibility
