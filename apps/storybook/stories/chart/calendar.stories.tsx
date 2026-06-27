import type { Meta, StoryObj } from '@storybook/react-vite'
import { Calendar } from '@cascivo/charts'

// One year of deterministic daily values.
const data = Array.from({ length: 365 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 0, 1) + i * 86_400_000)
  return { day: d.toISOString().slice(0, 10), value: (i * 7 + (i % 5) * 11) % 13 }
})

const meta: Meta<typeof Calendar> = {
  title: 'Charts/Calendar',
  component: Calendar,
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
type Story = StoryObj<typeof Calendar>

export const Default: Story = {
  args: { data, title: 'Contributions, 2026', height: 140, tooltip: true },
}
