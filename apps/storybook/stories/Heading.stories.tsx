import type { Meta, StoryObj } from '@storybook/react-vite'
import { Heading } from '@cascade-ui/components/heading'

const meta: Meta<typeof Heading> = {
  title: 'Display/Heading',
  component: Heading,
  args: { children: 'Section title' },
}
export default meta
type Story = StoryObj<typeof Heading>

export const Default: Story = {}

export const AllLevels: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 12 }}>
      {([1, 2, 3, 4, 5, 6] as const).map((level) => (
        <Heading key={level} level={level}>
          Heading level {level}
        </Heading>
      ))}
    </div>
  ),
}

export const DecoupledSize: Story = {
  args: { level: 2, size: '2xl', children: 'Visually 2xl, semantically h2' },
}

export const Accessibility: Story = {
  parameters: { a11y: { test: 'error' } },
}
