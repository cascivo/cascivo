# Form

Typed signal-based form store (createForm/useForm) with sync/async validation and a thin Form element wrapper

## Install

```bash
npx cascivo add form
```

## Category

`inputs`

## States

- `idle`
- `submitting`

## Props

| Prop        | Type                 | Required       | Default | Description |
| ----------- | -------------------- | -------------- | ------- | ----------- | --- |
| `form`      | `FormStore<T>`       | yes            | —       | —           |
| `onValid`   | `(values: T) => void | Promise<void>` | yes     | —           | —   |
| `children`  | `ReactNode`          | yes            | —       | —           |
| `className` | `string`             | no             | —       | —           |

## Examples

### Basic form with validation

```tsx
function Demo() {
  const form = useForm({
    initialValues: { email: '' },
    validate: (v) => (v.email.includes('@') ? {} : { email: 'Invalid email' }),
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
