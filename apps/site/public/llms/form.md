# Form

Typed signal-based form store (createForm/useForm) with sync/async validation and a thin Form element wrapper

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add form
```

Or use it from the prebuilt package without copying:

```tsx
import { Form } from '@cascivo/react'
```

## Category

`inputs`

## States

- `idle`
- `submitting`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `form` | `FormStore<T>` | yes | — | The form store holding values, validation, and submission state. |
| `onValid` | `(values: T) => void \| Promise<void>` | yes | — | Called with the values when the form passes validation. |
| `children` | `ReactNode` | yes | — | Content rendered inside the component. |
| `className` | `string` | no | — | Additional CSS class names merged onto the root element. |

## Examples

### Basic form with validation

```tsx
function Demo() {
  const form = useForm({
    initialValues: { email: '' },
    validate: (v) => v.email.includes('@') ? {} : { email: 'Invalid email' },
  })
  const email = form.field('email')
  return (
    <Form form={form} onValid={console.log}>
      <Input
        label="Email"
        value={email.value}
        onChange={(e) => email.onChange(e.currentTarget.value)}
        onBlur={email.onBlur}
        error={email.error}
      />
      <Button type="submit">Save</Button>
    </Form>
  )
}
```

## Design tokens

- `--cascivo-space-4`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `form`
- **Keyboard:** Tab, Enter

## Dependencies

- `@cascivo/core`

## Tags

form, validation, signals, input

---

_Generated from registry v0.8.0 on 2026-07-21. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
