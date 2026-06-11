import type { Meta, StoryObj } from '@storybook/react-vite'
import { ScatterChart } from '@cascade-ui/charts'

const series = [
  {
    id: 'group-a',
    label: 'Group A',
    data: [
      { x: 10, y: 20 },
      { x: 15, y: 35 },
      { x: 20, y: 28 },
      { x: 25, y: 42 },
      { x: 30, y: 38 },
    ],
  },
  {
    id: 'group-b',
    label: 'Group B',
    data: [
      { x: 12, y: 55 },
      { x: 18, y: 48 },
      { x: 22, y: 62 },
      { x: 28, y: 50 },
      { x: 35, y: 70 },
    ],
  },
]

const meta: Meta<typeof ScatterChart> = {
  title: 'Charts/ScatterChart',
  component: ScatterChart,
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
type Story = StoryObj<typeof ScatterChart>

export const Default: Story = {
  args: {
    series,
    title: 'Correlation scatter',
    legend: true,
  },
}

export const LargeRadius: Story = {
  args: {
    series: [series[0]!],
    title: 'Large radius points',
    r: 8,
  },
}
