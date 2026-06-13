import type { Meta, StoryObj } from '@storybook/react-vite'
import { Boxplot } from '@cascivo/charts'

const series = [
  { id: 'control', label: 'Control', values: [12, 18, 22, 25, 27, 30, 32, 35, 38, 45] },
  { id: 'treatment', label: 'Treatment', values: [20, 28, 35, 40, 42, 45, 48, 52, 55, 65] },
  { id: 'placebo', label: 'Placebo', values: [10, 15, 18, 22, 24, 26, 29, 31, 34, 40] },
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

export const Default: Story = {
  args: {
    series,
    title: 'Clinical trial results',
  },
}

export const TwoGroups: Story = {
  args: {
    series: [series[0]!, series[1]!],
    title: 'Control vs treatment',
  },
}
