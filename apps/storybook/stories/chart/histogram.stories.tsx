import type { Meta, StoryObj } from '@storybook/react-vite'
import { Histogram } from '@cascivo/charts'

const data = Array.from({ length: 120 }, (_, i) => 50 + ((i * 7) % 40) - ((i * 3) % 20))

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

export const Default: Story = { args: { data, title: 'Response time distribution', label: 'ms' } }
export const FewerBins: Story = { args: { data, title: 'Coarser bins', label: 'ms', bins: 6 } }
