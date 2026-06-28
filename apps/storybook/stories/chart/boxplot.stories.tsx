import type { Meta, StoryObj } from '@storybook/react-vite'
import { Boxplot } from '@cascivo/charts'

const series = [
  { id: 'a', label: 'Team A', values: [12, 15, 14, 10, 18, 22, 16, 13, 19, 11] },
  { id: 'b', label: 'Team B', values: [20, 25, 22, 30, 28, 19, 24, 26, 21, 27] },
  { id: 'c', label: 'Team C', values: [8, 9, 12, 7, 11, 10, 14, 6, 13, 9] },
]

const meta: Meta<typeof Boxplot> = {
  title: 'Charts/Boxplot',
  component: Boxplot,
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
type Story = StoryObj<typeof Boxplot>

export const Default: Story = { args: { series, title: 'Cycle time by team' } }
export const Empty: Story = { args: { series: [], title: 'No data yet' } }
