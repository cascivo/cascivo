// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AiStatus } from '@cascivo/react'

const meta: Meta = {
  title: 'Feedback/AiStatus',
}
export default meta
type Story = StoryObj

export const Thinking: Story = {
  name: 'Thinking',
  render: () => <AiStatus status="thinking" />,
}

export const GeneratingWithStop: Story = {
  name: 'Generating, with Stop',
  render: () => <AiStatus status="generating" onStop={() => {}} />,
}

export const CustomLabel: Story = {
  name: 'Custom label',
  render: () => <AiStatus status="thinking" label="Searching 12 documents…" />,
}

export const Complete: Story = {
  name: 'Complete',
  render: () => <AiStatus status="complete" />,
}

export const Error: Story = {
  name: 'Error',
  render: () => <AiStatus status="error" />,
}
