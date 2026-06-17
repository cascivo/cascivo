# Form

**Category:** inputs  
**Description:** Typed signal-based form store (createForm/useForm) with sync/async validation and a thin Form element wrapper

## When to use

- Collecting and submitting a set of related field values together
- Running sync or async validation (including Standard Schema like zod/valibot/arktype) before invoking onValid
- Tracking per-field touched state and errors via the signal-based store from useForm/createForm

## When NOT to use

- A single standalone value with no submission step — render a bare Input
- Inline editing of one read-only value — use Editable

## Anti-patterns

### The store centralizes values, errors, touched, and submitting as signals; rolling your own reintroduces the re-render and validation-timing bugs the store solves

**Bad:** `<form onSubmit={...}> with hand-rolled useState per field`  
**Good:** `const form = useForm({ initialValues, validate }); <Form form={form} onValid={...}>`  
**Why:** The store centralizes values, errors, touched, and submitting as signals; rolling your own reintroduces the re-render and validation-timing bugs the store solves

## Related components

- **Input** (contains): Form wraps field controls like Input, wiring value/onChange/onBlur/error from form.field()
- **FileUploader** (contains): File attachments can participate in a Form submission

## Accessibility rationale

Renders a native <form> with noValidate so validation messages come from the component (surfaced per field via Input error/role="alert") rather than inconsistent browser bubbles, while Enter-to-submit and the form role are preserved by the platform element.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `form` | `FormStore<T>` | Yes | — | — |
| `onValid` | `(values: T) => void | Promise<void>` | Yes | — | — |
| `children` | `ReactNode` | Yes | — | — |
| `className` | `string` | No | — | — |

## Tokens

- `--cascivo-space-4`

## Examples

### Basic form with validation

```jsx
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

## Boundaries

| Area | Level | Note |
|------|-------|------|
| validation strategy | flexible | Use schema, validate, or both; schema runs first and validate only if the schema passes |
| field control composition | flexible | Any control can be wired via form.field(name); children are free-form |
| submit semantics | strict | onValid only fires when validation produces no errors; submission is guarded by the submitting signal |
