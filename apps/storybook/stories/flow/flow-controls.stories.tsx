// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { FlowControls } from '@cascivo/flow'

const meta: Meta = {
  title: 'Flow/FlowControls',
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

export const CanvasControls: Story = {
  name: "Canvas controls",
  render: () => (
  <div style={{ position: 'relative', height: 200, border: '1px solid var(--cascivo-color-border)' }}>
    <FlowControls onZoomIn={() => {}} onZoomOut={() => {}} onFitView={() => {}} />
  </div>
),
}

