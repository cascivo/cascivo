import type { Meta, StoryObj } from '@storybook/react-vite'
import { ProgressIndicator } from '@cascivo/components/progress-indicator'

const steps = [
  { label: 'Cart', description: 'Review your items' },
  { label: 'Shipping', description: 'Address and method' },
  { label: 'Payment', description: 'Card details' },
  { label: 'Review', description: 'Confirm order' },
]

const meta: Meta<typeof ProgressIndicator> = {
  title: 'Navigation/ProgressIndicator',
  component: ProgressIndicator,
  args: {
    steps,
    currentIndex: 1,
  },
}
export default meta
type Story = StoryObj<typeof ProgressIndicator>

export const Default: Story = {}

export const FirstStep: Story = {
  args: { currentIndex: 0 },
}

export const LastStep: Story = {
  args: { currentIndex: 3 },
}

export const AllComplete: Story = {
  args: { currentIndex: 4 },
}

export const WithoutDescriptions: Story = {
  args: {
    steps: [{ label: 'Account' }, { label: 'Profile' }, { label: 'Confirm' }],
    currentIndex: 1,
  },
}

export const Vertical: Story = {
  args: { vertical: true, currentIndex: 2 },
}

export const Accessibility: Story = {
  args: { currentIndex: 2 },
  parameters: {
    a11y: { test: 'error' },
  },
}
