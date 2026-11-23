// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Toc } from '@cascivo/react'

const meta: Meta = {
  title: 'Navigation/Toc',
}
export default meta
type Story = StoryObj

export const Basic: Story = {
  name: 'Basic',
  render: () => (
    <Toc
      items={[
        { id: 'intro', label: 'Introduction' },
        { id: 'usage', label: 'Usage' },
        { id: 'api', label: 'API', level: 3 },
      ]}
    />
  ),
}

export const ControlledActiveItem: Story = {
  name: 'Controlled active item',
  render: () => (
    <Toc
      activeId="usage"
      items={[
        { id: 'intro', label: 'Introduction' },
        { id: 'usage', label: 'Usage' },
      ]}
    />
  ),
}
