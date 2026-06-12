import type { Meta, StoryObj } from '@storybook/react-vite'
import { Text } from '@cascade-ui/components/text'

const meta: Meta<typeof Text> = {
  title: 'Display/Text',
  component: Text,
  args: { children: 'The quick brown fox jumps over the lazy dog.' },
}
export default meta
type Story = StoryObj<typeof Text>

export const Default: Story = {}
export const Muted: Story = { args: { muted: true, size: 'sm' } }

export const SizesAndWeights: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 8 }}>
      <Text size="sm">Small normal</Text>
      <Text size="md" weight="medium">
        Medium weight
      </Text>
      <Text size="lg" weight="semibold">
        Large semibold
      </Text>
    </div>
  ),
}

export const Accessibility: Story = {
  parameters: { a11y: { test: 'error' } },
}
