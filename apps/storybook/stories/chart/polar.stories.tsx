import type { Meta, StoryObj } from '@storybook/react-vite'
import { Polar } from '@cascivo/charts'

const data = [
  { label: 'N', value: 12 },
  { label: 'NE', value: 7 },
  { label: 'E', value: 8 },
  { label: 'SE', value: 4 },
  { label: 'S', value: 5 },
  { label: 'SW', value: 9 },
  { label: 'W', value: 15 },
  { label: 'NW', value: 11 },
]

const meta: Meta<typeof Polar> = {
  title: 'Charts/Polar',
  component: Polar,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (S) => (
      <div style={{ inlineSize: 'min(34rem, 95vw)', padding: '2rem' }}>
        <S />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof Polar>

export const Rose: Story = {
  args: { data, title: 'Wind by direction', mode: 'bar', tooltip: true },
}
export const Line: Story = { args: { data, title: 'Polar line', mode: 'line', tooltip: true } }
export const Area: Story = { args: { data, title: 'Polar area', mode: 'area', tooltip: true } }
