import type { Meta, StoryObj } from '@storybook/react-vite'
import { Switcher } from '@cascade-ui/components/switcher'
import { Grid, BarChart, Settings } from '@cascade-ui/icons'

const meta: Meta<typeof Switcher> = {
  component: Switcher,
  decorators: [
    (Story) => (
      <div style={{ maxInlineSize: '20rem', border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof Switcher>

export const Default: Story = {
  args: {
    items: [
      { label: 'Console', href: '#', active: true },
      { label: 'Billing', href: '#' },
      { divider: true },
      { label: 'Documentation', href: '#' },
    ],
  },
}

export const WithIconsAndDividers: Story = {
  args: {
    items: [
      { label: 'Console', href: '#', active: true, icon: <Grid size={16} /> },
      { label: 'Analytics', href: '#', icon: <BarChart size={16} /> },
      { divider: true },
      { label: 'Admin', href: '#', icon: <Settings size={16} /> },
    ],
  },
}
