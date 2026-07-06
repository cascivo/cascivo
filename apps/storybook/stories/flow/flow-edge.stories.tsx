// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { FlowEdge } from '@cascivo/flow'

const meta: Meta = {
  title: 'Flow/FlowEdge',
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

export const EdgePathTypes: Story = {
  name: "Edge path types",
  render: () => (
  <div style={{ position: 'relative', height: 220 }}>
    <FlowEdge sourceX={20} sourceY={30} targetX={260} targetY={30} type="bezier" label="bezier" />
    <FlowEdge sourceX={20} sourceY={90} targetX={260} targetY={90} type="smoothstep" label="step" />
    <FlowEdge sourceX={20} sourceY={150} targetX={260} targetY={150} animated label="animated" />
  </div>
),
}

export const ArrowDirection: Story = {
  name: "Arrow direction",
  render: () => (
  <div style={{ position: 'relative', height: 260 }}>
    <FlowEdge sourceX={20} sourceY={30} targetX={260} targetY={30} label="forward" />
    <FlowEdge sourceX={20} sourceY={90} targetX={260} targetY={90} markerEnd={false} markerStart label="backward" />
    <FlowEdge sourceX={20} sourceY={150} targetX={260} targetY={150} markerStart label="both" />
    <FlowEdge sourceX={20} sourceY={210} targetX={260} targetY={210} markerEnd={false} label="undirected" />
  </div>
),
}

