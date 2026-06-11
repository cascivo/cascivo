import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Input } from '@cascade-ui/components/input'
import { Form, createForm, useForm } from '@cascade-ui/components/form'

function BasicDemo() {
  const form = useForm<{ email: string }>({
    initialValues: { email: '' },
    validate: (v) => (v.email.includes('@') ? {} : { email: 'Invalid email address' }),
  })
  const email = form.field('email')
  const [submitted, setSubmitted] = useState<string | null>(null)
  return (
    <div style={{ maxWidth: '24rem' }}>
      <Form form={form} onValid={(v) => setSubmitted(JSON.stringify(v))}>
        <Input
          label="Email"
          type="email"
          value={email.value}
          onChange={(e) => email.onChange(e.currentTarget.value)}
          onBlur={email.onBlur}
          {...(email.error !== undefined ? { error: email.error } : {})}
        />
        <button type="submit" style={{ marginTop: '0.5rem' }}>
          Submit
        </button>
      </Form>
      {submitted && <pre style={{ marginTop: '1rem' }}>Submitted: {submitted}</pre>}
    </div>
  )
}

const meta: Meta = { title: 'Inputs/Form', component: Form, parameters: { layout: 'fullscreen' } }
export default meta
type Story = StoryObj

export const Default: Story = { render: () => <BasicDemo /> }

export const Accessibility: Story = {
  render: () => <BasicDemo />,
  parameters: { a11y: { test: 'error' } },
}
