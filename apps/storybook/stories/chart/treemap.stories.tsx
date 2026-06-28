import type { Meta, StoryObj } from '@storybook/react-vite'
import { Treemap } from '@cascivo/charts'

const data = [
  { id: 'eng', label: 'Engineering', value: 42 },
  { id: 'sales', label: 'Sales', value: 28 },
  { id: 'mkt', label: 'Marketing', value: 16 },
  { id: 'ops', label: 'Ops', value: 9 },
  { id: 'hr', label: 'People', value: 5 },
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

export const Default: Story = { args: { data, title: 'Headcount by team' } }
export const Empty: Story = { args: { data: [], title: 'No data yet' } }
