import type { Meta, StoryObj } from '@storybook/react-vite'
import { Funnel } from '@cascivo/charts'

const data = [
  { id: 'visit', label: 'Visited', value: 8200 },
  { id: 'signup', label: 'Signed up', value: 3100 },
  { id: 'active', label: 'Activated', value: 1400 },
  { id: 'paid', label: 'Paid', value: 520 },
]

const meta: Meta<typeof Funnel> = {
  title: 'Charts/Funnel',
  component: Funnel,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 'min(40rem, 90vw)', padding: '2rem' }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof Funnel>

export const Default: Story = {
  args: {
    data,
    title: 'Signup funnel',
    tooltip: true,
  },
}

export const WithConversion: Story = {
  args: {
    data,
    title: 'Signup funnel — conversion',
    showConversion: true,
    tooltip: true,
  },
}

export const Empty: Story = {
  args: {
    data: [],
    title: 'No data yet',
  },
}
