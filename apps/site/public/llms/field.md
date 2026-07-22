# Field

Form-field wrapper composing label, control, description, and error

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add field
```

Or use it from the prebuilt package without copying:

```tsx
import { Field } from '@cascivo/react'
```

## Category

`inputs`

## States

- `default`
- `disabled`
- `invalid`

## Props

| Prop          | Type           | Required | Default | Description                                                        |
| ------------- | -------------- | -------- | ------- | ------------------------------------------------------------------ |
| `label`       | `ReactNode`    | no       | —       | Text label for the control.                                        |
| `description` | `ReactNode`    | no       | —       | Supporting description text.                                       |
| `error`       | `ReactNode`    | no       | —       | Error message shown when the value is invalid.                     |
| `required`    | `boolean`      | no       | `false` | When true, marks the field as required.                            |
| `disabled`    | `boolean`      | no       | `false` | When true, disables the control and removes it from the tab order. |
| `id`          | `string`       | no       | —       | Id applied to the root element (auto-generated when omitted).      |
| `children`    | `ReactElement` | yes      | —       | Content rendered inside the component.                             |

## Examples

### Basic

```tsx
<Field label="Email">
  <Input type="email" />
</Field>
```

### With description

```tsx
<Field label="Email" description="We never share it.">
  <Input />
</Field>
```

### With error

Sets aria-invalid on the control and announces the error via role="alert".

```tsx
<Field label="Email" error="Email is required" required>
  <Input />
</Field>
```

## Design tokens

- `--cascivo-space-2`
- `--cascivo-font-sans`
- `--cascivo-text-sm`
- `--cascivo-leading-snug`
- `--cascivo-color-text-muted`
- `--cascivo-color-destructive`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `group`

## Dependencies

- `@cascivo/core`

## Tags

form, layout, validation, accessibility

---

_Generated from registry v0.10.0 on 2026-07-22. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
