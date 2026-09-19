// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field, Input } from '@cascivo/react'

const meta: Meta = {
  title: 'Inputs/Field',
}
export default meta
type Story = StoryObj

export const Basic: Story = {
  name: 'Basic',
  render: () => (
    <Field label="Email">
      <Input type="email" />
    </Field>
  ),
}

export const WithDescription: Story = {
  name: 'With description',
  render: () => (
    <Field label="Email" description="We never share it.">
      <Input />
    </Field>
  ),
}

export const WithError: Story = {
  name: 'With error',
  render: () => (
    <Field label="Email" error="Email is required" required>
      <Input />
    </Field>
  ),
}
