import type { Meta, StoryObj } from '@storybook/react-vite'
import { ProgressBar } from '@cascade-ui/components/progress-bar'

const meta: Meta<typeof ProgressBar> = {
  title: 'Feedback/ProgressBar',
  component: ProgressBar,
  args: { value: 60, label: 'Uploading' },
}
export default meta
type Story = StoryObj<typeof ProgressBar>

export const Determinate: Story = {}
export const Indeterminate: Story = { args: { label: 'Processing' } }

export const WithHelperText: Story = {
  args: { value: 30, helperText: '3 of 10 files uploaded' },
}

export const Success: Story = {
  args: { value: 100, status: 'success', label: 'Upload complete' },
}

export const Error: Story = {
  args: { value: 45, status: 'error', label: 'Upload failed', helperText: 'Network error' },
}

export const CustomMax: Story = {
  args: { value: 5, max: 20, label: 'Steps completed' },
}

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 320 }}>
      <ProgressBar size="sm" value={40} label="Small" />
      <ProgressBar size="md" value={40} label="Medium" />
    </div>
  ),
}

export const Accessibility: Story = {
  args: { value: 70, label: 'Importing contacts', helperText: '700 of 1000 imported' },
  parameters: {
    a11y: { test: 'error' },
  },
}
