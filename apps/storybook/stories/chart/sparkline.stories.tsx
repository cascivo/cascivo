import type { Meta, StoryObj } from '@storybook/react-vite'
import { Sparkline } from '@cascivo/charts'

const data = [4, 6, 5, 8, 7, 9, 6, 10, 8, 12, 11, 14]

const meta: Meta<typeof Sparkline> = {
  title: 'Charts/Sparkline',
  component: Sparkline,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 'min(20rem, 90vw)', padding: '2rem' }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof Sparkline>

export const Default: Story = { args: { data, label: 'Sessions, last 12 weeks' } }
export const WithEndDot: Story = { args: { data, label: 'Sessions', endDot: true } }
