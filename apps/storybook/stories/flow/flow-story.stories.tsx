// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { FlowStory } from '@cascivo/flow'

const meta: Meta = {
  title: 'Flow/FlowStory',
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

export const ARequestResponseStoryboard: Story = {
  name: "A request/response storyboard",
  render: () => (
  <FlowStory
    style={{ height: 340 }}
    nodes={[
      { id: 'A', position: { x: 0, y: 100 }, data: { label: 'Client' } },
      { id: 'B', position: { x: 240, y: 100 }, data: { label: 'Gateway' } },
      { id: 'C', position: { x: 480, y: 100 }, data: { label: 'Service' } },
    ]}
    edges={[
      { id: 'ab', source: 'A', target: 'B' },
      { id: 'bc', source: 'B', target: 'C' },
    ]}
    script={[
      { from: 'A', to: 'B', label: 'Request sent' },
      { from: 'B', to: 'A', label: 'Acknowledged' },
      { from: 'A', to: 'B', label: 'Payload streamed' },
      { from: 'B', to: 'C', label: 'Forwarded to Service' },
    ]}
    loop
  />
),
}

export const ALinearPipeline: Story = {
  name: "A linear pipeline",
  render: () => (
  <FlowStory
    style={{ height: 320 }}
    nodes={[
      { id: 'ingest', position: { x: 0, y: 100 }, data: { label: 'Ingest' } },
      { id: 'transform', position: { x: 240, y: 100 }, data: { label: 'Transform' } },
      { id: 'load', position: { x: 480, y: 100 }, data: { label: 'Load' } },
    ]}
    edges={[
      { id: 'it', source: 'ingest', target: 'transform' },
      { id: 'tl', source: 'transform', target: 'load' },
    ]}
    script={[
      { from: 'ingest', to: 'transform', label: 'Records ingested', description: 'Raw events read from the source' },
      { from: 'transform', to: 'load', label: 'Transformed', description: 'Cleaned and enriched' },
    ]}
  />
),
}

