import type { Meta, StoryObj } from '@storybook/react-vite'
import { Radar } from '@cascivo/charts'

const axes = ['Speed', 'Power', 'Range', 'Defense', 'Support']
const series = [
  { id: 'a', label: 'Build A', values: [80, 60, 70, 50, 90] },
  { id: 'b', label: 'Build B', values: [55, 85, 60, 75, 65] },
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

export const Default: Story = { args: { axes, series, title: 'Loadout comparison', max: 100 } }
export const Single: Story = {
  args: { axes, series: [series[0]!], title: 'Build A profile', max: 100 },
}
