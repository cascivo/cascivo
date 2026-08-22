// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { FlowMiniMap } from '@cascivo/flow'

const meta: Meta = {
  title: 'Flow/FlowMiniMap',
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

export const GraphOverview: Story = {
  name: 'Graph overview',
  render: () => (
    <FlowMiniMap
      nodes={[
        { id: 'a', position: { x: 0, y: 0 } },
        { id: 'b', position: { x: 220, y: 120 } },
        { id: 'c', position: { x: 440, y: 0 } },
      ]}
      viewport={{ x: 0, y: 0, zoom: 1 }}
      containerWidth={400}
      containerHeight={300}
    />
  ),
}
