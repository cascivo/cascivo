import type { Meta, StoryObj } from '@storybook/react-vite'
import { Radio, RadioGroup } from '@cascivo/components/radio'

const meta: Meta<typeof Radio> = {
  title: 'Inputs/Radio',
  component: Radio,
}
export default meta
type Story = StoryObj<typeof Radio>

export const Primary: Story = {}

export const Group: Story = {
  render: () => (
    <RadioGroup name="plan" defaultValue="pro">
      <Radio value="free" label="Free" />
      <Radio value="pro" label="Pro" />
      <Radio value="team" label="Team" />
    </RadioGroup>
  ),
}

export const WithDisabledOption: Story = {
  render: () => (
    <RadioGroup name="tier" defaultValue="basic">
      <Radio value="basic" label="Basic" />
      <Radio value="premium" label="Premium" />
      <Radio value="enterprise" label="Enterprise (contact sales)" disabled />
    </RadioGroup>
  ),
}

export const Accessibility: Story = {
  render: () => (
    <RadioGroup name="ship" defaultValue="standard">
      <Radio value="standard" label="Standard shipping" />
      <Radio value="express" label="Express shipping" />
    </RadioGroup>
  ),
  parameters: { a11y: { test: 'error' } },
}
