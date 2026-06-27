import type { Meta, StoryObj } from '@storybook/react-vite'
import { Sunburst } from '@cascivo/charts'

const data = {
  label: 'root',
  children: [
    {
      label: 'Engineering',
      children: [
        { label: 'Frontend', value: 28 },
        { label: 'Backend', value: 24 },
        { label: 'Infra', value: 14 },
      ],
    },
    {
      label: 'Product',
      children: [
        { label: 'Design', value: 12 },
        { label: 'PM', value: 8 },
      ],
    },
    { label: 'Sales', value: 18 },
  ],
}

const meta: Meta<typeof Sunburst> = {
  title: 'Charts/Sunburst',
  component: Sunburst,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (S) => (
      <div style={{ inlineSize: 'min(40rem, 90vw)', padding: '2rem' }}>
        <S />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof Sunburst>

export const Default: Story = { args: { data, title: 'Headcount', size: 320, tooltip: true } }
