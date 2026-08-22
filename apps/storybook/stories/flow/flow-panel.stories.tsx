// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { FlowPanel } from '@cascivo/flow'

const meta: Meta = {
  title: 'Flow/FlowPanel',
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

export const ALegendPanel: Story = {
  name: "A legend panel",
  render: () => (
  <div style={{ position: 'relative', height: 160, border: '1px solid var(--cascivo-color-border)' }}>
    <FlowPanel position="top-right">Legend</FlowPanel>
  </div>
),
}

