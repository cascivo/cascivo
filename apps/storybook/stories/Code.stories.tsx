import type { Meta, StoryObj } from '@storybook/react-vite'
import { Code } from '@cascade-ui/components/code'

const meta: Meta<typeof Code> = {
  title: 'Display/Code',
  component: Code,
  args: { children: 'npx cascade add button' },
}
export default meta
type Story = StoryObj<typeof Code>

export const Default: Story = {}
export const Small: Story = { args: { size: 'sm', children: '--cascade-color-accent' } }

export const InProse: Story = {
  render: () => (
    <p>
      Run <Code>vp check</Code> before committing — it wraps <Code>fmt</Code>, <Code>lint</Code>,
      and <Code>tsc</Code>.
    </p>
  ),
}

export const Accessibility: Story = {
  parameters: { a11y: { test: 'error' } },
}
