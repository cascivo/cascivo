import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Form',
  description:
    'Typed signal-based form store (createForm/useForm) with sync/async validation and a thin Form element wrapper',
  category: 'inputs',
  states: ['idle', 'submitting'],
  variants: [],
  sizes: [],
  props: [
    { name: 'form', type: 'FormStore<T>', required: true },
    { name: 'onValid', type: '(values: T) => void | Promise<void>', required: true },
    { name: 'children', type: 'ReactNode', required: true },
    { name: 'className', type: 'string', required: false },
  ],
  tokens: ['--cascade-space-4'],
  accessibility: {
    role: 'form',
    wcag: 'AA',
    keyboard: ['Tab', 'Enter'],
  },
  examples: [
    {
      title: 'Basic form with validation',
      code: `function Demo() {
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
}`,
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['form', 'validation', 'signals', 'input'],
}
