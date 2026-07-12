// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Steps } from '@cascivo/react'

const meta: Meta = {
  title: 'Navigation/Steps',
}
export default meta
type Story = StoryObj

export const HorizontalDefault: Story = {
  name: 'Horizontal (default)',
  render: () => (
    <Steps
      steps={[{ label: 'Cart' }, { label: 'Shipping' }, { label: 'Payment' }, { label: 'Confirm' }]}
      activeStep={1}
    />
  ),
}

export const Vertical: Story = {
  name: 'Vertical',
  render: () => (
    <Steps
      orientation="vertical"
      steps={[{ label: 'Account info' }, { label: 'Profile details' }, { label: 'Preferences' }]}
      activeStep={0}
    />
  ),
}

export const WithExplicitErrorState: Story = {
  name: 'With explicit error state',
  render: () => (
    <Steps
      steps={[{ label: 'Upload' }, { label: 'Validate', state: 'error' }, { label: 'Process' }]}
      activeStep={1}
    />
  ),
}
