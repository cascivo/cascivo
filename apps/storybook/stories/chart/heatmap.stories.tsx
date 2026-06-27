import type { Meta, StoryObj } from '@storybook/react-vite'
import { Heatmap } from '@cascivo/charts'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const hours = ['9a', '12p', '3p', '6p']
const data = days.flatMap((x, i) =>
  hours.map((y, j) => ({ x, y, value: ((i * 7 + j * 3) % 11) + 1 })),
)

const meta: Meta<typeof Heatmap> = {
  title: 'Charts/Heatmap',
  component: Heatmap,
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
type Story = StoryObj<typeof Heatmap>

export const Default: Story = { args: { data, title: 'Activity by day & hour' } }
export const Empty: Story = { args: { data: [], title: 'No data yet' } }
