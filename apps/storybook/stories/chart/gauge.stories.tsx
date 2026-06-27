import type { Meta, StoryObj } from '@storybook/react-vite'
import { Gauge } from '@cascivo/charts'

const meta: Meta<typeof Gauge> = {
  title: 'Charts/Gauge',
  component: Gauge,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (S) => (
      <div style={{ inlineSize: 'min(28rem, 95vw)', padding: '2rem' }}>
        <S />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof Gauge>

export const Default: Story = { args: { title: 'CPU load', value: 72, unit: '%' } }

export const WithThresholds: Story = {
  args: {
    title: 'CPU load',
    value: 72,
    unit: '%',
    thresholds: [
      { upTo: 50, color: 'var(--cascivo-chart-2)' },
      { upTo: 80, color: 'var(--cascivo-chart-3)' },
      { upTo: 100, color: 'var(--cascivo-chart-4)' },
    ],
  },
}
