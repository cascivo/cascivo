import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stream } from '@cascivo/charts'

const categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
const series = [
  { id: 'a', label: 'React', values: [4, 6, 5, 8, 7, 9, 11, 10] },
  { id: 'b', label: 'Vue', values: [2, 3, 7, 4, 6, 5, 4, 6] },
  { id: 'c', label: 'Svelte', values: [1, 2, 2, 3, 5, 6, 7, 9] },
  { id: 'd', label: 'Solid', values: [0, 1, 1, 2, 2, 3, 4, 5] },
]

const meta: Meta<typeof Stream> = {
  title: 'Charts/Stream',
  component: Stream,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (S) => (
      <div style={{ inlineSize: 'min(48rem, 90vw)', padding: '2rem' }}>
        <S />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof Stream>

export const Default: Story = {
  args: { series, categories, title: 'Framework mentions', tooltip: true, legend: true },
}
export const ZeroBaseline: Story = {
  args: { series, categories, title: 'Stacked (zero baseline)', offset: 'zero', legend: true },
}
