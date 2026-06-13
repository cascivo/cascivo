import type { Meta, StoryObj } from '@storybook/react-vite'
import { Histogram } from '@cascivo/charts'

// Deterministic sample: normal-ish distribution 0-100
const data = [
  12, 18, 25, 31, 36, 40, 44, 47, 50, 52, 53, 55, 57, 59, 60, 62, 63, 65, 66, 68, 69, 70, 71, 72,
  73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 55, 58, 62, 65, 68,
  71, 74,
]

const meta: Meta<typeof Histogram> = {
  title: 'Charts/Histogram',
  component: Histogram,
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
type Story = StoryObj<typeof Histogram>

export const Default: Story = {
  args: {
    data,
    title: 'Score distribution',
    label: 'Score',
  },
}

export const FixedBins: Story = {
  args: {
    data,
    title: 'Score distribution (10 bins)',
    label: 'Score',
    bins: 10,
  },
}
