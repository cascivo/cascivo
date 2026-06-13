import type { Meta, StoryObj } from '@storybook/react-vite'
import { Radar } from '@cascivo/charts'

const axes = ['Speed', 'Power', 'Range', 'Efficiency', 'Cost']
const series = [
  { id: 'model-a', label: 'Model A', values: [80, 70, 60, 90, 50] },
  { id: 'model-b', label: 'Model B', values: [60, 85, 75, 65, 80] },
]

const meta: Meta<typeof Radar> = {
  title: 'Charts/Radar',
  component: Radar,
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
type Story = StoryObj<typeof Radar>

export const Default: Story = {
  args: {
    axes,
    series,
    title: 'Model comparison',
  },
}

export const SingleSeries: Story = {
  args: {
    axes,
    series: [series[0]!],
    title: 'Model A profile',
    max: 100,
  },
}
