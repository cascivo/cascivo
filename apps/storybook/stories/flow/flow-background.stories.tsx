// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { FlowBackground } from '@cascivo/flow'

const meta: Meta = {
  title: 'Flow/FlowBackground',
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

export const DottedBackground: Story = {
  name: "Dotted background",
  render: () => (
  <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
    <FlowBackground variant="dots" gap={24} />
  </div>
),
}

export const GridAndCross: Story = {
  name: "Grid and cross",
  render: () => (
  <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
    <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
      <FlowBackground variant="grid" gap={28} />
    </div>
    <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
      <FlowBackground variant="cross" gap={28} size={4} />
    </div>
  </div>
),
}

