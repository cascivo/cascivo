import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '@cascivo/components/button'

const meta: Meta<typeof Button> = {
  title: 'Inputs/Button',
  component: Button,
  args: { children: 'Button' },
}
export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {}
export const Secondary: Story = { args: { variant: 'secondary' } }
export const Ghost: Story = { args: { variant: 'ghost' } }
export const Destructive: Story = { args: { variant: 'destructive' } }
export const Loading: Story = { args: { loading: true, children: 'Saving…' } }
export const Disabled: Story = { args: { disabled: true } }

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Button size="sm">Sm</Button>
      <Button size="md">Md</Button>
      <Button size="lg">Lg</Button>
    </div>
  ),
}

export const Accessibility: Story = {
  args: { children: 'Confirm order' },
  parameters: {
    a11y: { test: 'error' },
  },
}
