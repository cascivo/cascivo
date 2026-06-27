import type { Meta, StoryObj } from '@storybook/react-vite'
import { Candlestick } from '@cascivo/charts'

// Deterministic OHLC walk.
const data = Array.from({ length: 20 }, (_, i) => {
  const base = 100 + Math.round(10 * Math.sin(i / 2))
  const open = base + (i % 3)
  const close = base + ((i * 7) % 5) - 2
  const high = Math.max(open, close) + 3
  const low = Math.min(open, close) - 3
  return { t: `D${i + 1}`, open, high, low, close, volume: 50 + ((i * 13) % 50) }
})

const meta: Meta<typeof Candlestick> = {
  title: 'Charts/Candlestick',
  component: Candlestick,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (S) => (
      <div style={{ inlineSize: 'min(56rem, 95vw)', padding: '2rem' }}>
        <S />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof Candlestick>

export const Default: Story = {
  args: { data, title: 'ACME daily', tooltip: true },
}

export const WithVolume: Story = {
  args: { data, title: 'ACME daily + volume', tooltip: true, volume: true },
}
