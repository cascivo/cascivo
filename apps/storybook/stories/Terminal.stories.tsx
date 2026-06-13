import type { Meta, StoryObj } from '@storybook/react-vite'
import { Terminal } from '@cascivo/ai'

const meta: Meta<typeof Terminal> = {
  title: 'Display/Terminal',
  component: Terminal,
  parameters: { layout: 'fullscreen' },
  args: {
    lines: [
      { text: 'npx cascivo add button', prefix: '$', type: 'command' },
      { text: '✓ Button added to src/components/Button.tsx', type: 'output' },
      { text: '✓ Done in 0.12s', type: 'output' },
    ],
  },
}
export default meta
type Story = StoryObj<typeof Terminal>

export const Default: Story = {}
export const WithError: Story = {
  args: {
    lines: [
      { text: 'npx cascivo add unknown', prefix: '$', type: 'command' },
      { text: 'Error: component "unknown" not found in registry', type: 'error' },
    ],
  },
}
