// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { FlowNode, FlowHandle } from '@cascivo/flow'

const meta: Meta = {
  title: 'Flow/FlowHandle',
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 'min(56rem, 92vw)', padding: '1.5rem' }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj

export const SourceAndTargetPorts: Story = {
  name: 'Source and target ports',
  render: () => (
    <div style={{ position: 'relative', height: 160 }}>
      <FlowNode id="api" defaultPosition={{ x: 70, y: 55 }}>
        API
        <FlowHandle type="target" position="left" />
        <FlowHandle type="source" position="right" />
      </FlowNode>
    </div>
  ),
}
