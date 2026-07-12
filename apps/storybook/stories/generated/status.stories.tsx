// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Status } from '@cascivo/react'

const meta: Meta = {
  title: 'Display/Status',
}
export default meta
type Story = StoryObj

export const Default: Story = {
  name: 'Default',
  render: () => <Status>Unknown</Status>,
}

export const Success: Story = {
  name: 'Success',
  render: () => <Status status="success">Operational</Status>,
}

export const Pulsing: Story = {
  name: 'Pulsing',
  render: () => (
    <Status status="info" pulse>
      Deploying
    </Status>
  ),
}
