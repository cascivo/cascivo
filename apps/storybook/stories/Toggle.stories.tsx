import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Toggle } from '@cascivo/components/toggle'

const meta: Meta<typeof Toggle> = {
  title: 'Inputs/Toggle',
  component: Toggle,
  args: { label: 'Notifications' },
}
export default meta
type Story = StoryObj<typeof Toggle>

export const Primary: Story = {}

export const Default: Story = {}
export const On: Story = { args: { defaultChecked: true } }
export const Disabled: Story = { args: { disabled: true } }
export const SmallSize: Story = { args: { size: 'sm', label: 'Compact' } }

function ControlledDemo() {
  const [checked, setChecked] = useState(true)
  return (
    <Toggle
      label={checked ? 'Dark mode on' : 'Dark mode off'}
      checked={checked}
      onChange={setChecked}
    />
  )
}

export const Controlled: Story = { render: () => <ControlledDemo /> }

export const Accessibility: Story = {
  args: { label: 'Enable two-factor auth', defaultChecked: true },
  parameters: { a11y: { test: 'error' } },
}
