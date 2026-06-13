import type { Meta, StoryObj } from '@storybook/react-vite'
import { Treemap } from '@cascivo/charts'

const data = [
  { id: 'react', label: 'React', value: 42 },
  { id: 'vue', label: 'Vue', value: 25 },
  { id: 'angular', label: 'Angular', value: 18 },
  { id: 'svelte', label: 'Svelte', value: 8 },
  { id: 'solid', label: 'Solid', value: 4 },
  { id: 'other', label: 'Other', value: 3 },
]

const meta: Meta<typeof Treemap> = {
  title: 'Charts/Treemap',
  component: Treemap,
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
type Story = StoryObj<typeof Treemap>

export const Default: Story = {
  args: {
    data,
    title: 'Framework usage share',
  },
}
