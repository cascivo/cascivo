// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stat } from '@cascivo/react'

const meta: Meta = {
  title: 'Display/Stat',
}
export default meta
type Story = StoryObj

export const Default: Story = {
  name: 'Default',
  render: () => <Stat label="Components" value={106} />,
}

export const WithTrend: Story = {
  name: 'With trend',
  render: () => <Stat label="Bundle size" value="12.4 kB" delta="-1.2 kB" trend="up" />,
}

export const WithHelpText: Story = {
  name: 'With help text',
  render: () => <Stat label="Axe violations" value={0} helpText="WCAG 2.1 AA, 4 app states" />,
}
