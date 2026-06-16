import type { Meta, StoryObj } from '@storybook/react-vite'
import { RadioCard, RadioCardGroup } from '@cascivo/components/radio-card'

const meta: Meta<typeof RadioCardGroup> = {
  title: 'Inputs/RadioCard',
  component: RadioCardGroup,
}
export default meta
type Story = StoryObj<typeof RadioCardGroup>

export const Primary: Story = {}

export const Default: Story = {
  render: () => (
    <RadioCardGroup name="plan" defaultValue="pro" label="Plan">
      <RadioCard value="free" title="Free" description="2 projects, community support" />
      <RadioCard value="pro" title="Pro" description="Unlimited projects, email support" />
      <RadioCard value="team" title="Team" description="SSO, audit log, priority support" />
    </RadioCardGroup>
  ),
}

export const Disabled: Story = {
  render: () => (
    <RadioCardGroup name="plan2" label="Plan (disabled)">
      <RadioCard value="free" title="Free" description="Available" />
      <RadioCard value="enterprise" title="Enterprise" description="Contact sales" disabled />
    </RadioCardGroup>
  ),
}
