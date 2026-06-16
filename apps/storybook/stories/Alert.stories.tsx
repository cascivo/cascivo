import type { Meta, StoryObj } from '@storybook/react-vite'
import { Alert } from '@cascivo/components/alert'

const meta: Meta<typeof Alert> = {
  title: 'Display/Alert',
  component: Alert,
  args: { title: 'Heads up', children: 'Your trial ends in 3 days.' },
}
export default meta
type Story = StoryObj<typeof Alert>

export const Primary: Story = {}

export const Default: Story = {}
export const Info: Story = { args: { variant: 'info' } }
export const Success: Story = {
  args: { variant: 'success', title: 'Saved', children: 'Your changes have been saved.' },
}
export const Warning: Story = {
  args: { variant: 'warning', title: 'Storage almost full', children: '90% of quota used.' },
}
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    title: 'Something went wrong',
    children: "We couldn't process your request.",
  },
}
export const Dismissible: Story = {
  args: { variant: 'success', title: 'Saved', dismissible: true },
}
export const Actionable: Story = {
  args: {
    variant: 'warning',
    title: 'Update available',
    children: 'A new version is ready to install.',
    action: { label: 'Update now', onClick: () => {} },
  },
}

export const Accessibility: Story = {
  args: { variant: 'destructive', title: 'Payment failed', dismissible: true },
  parameters: { a11y: { test: 'error' } },
}
