// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { PromptSuggestions } from '@cascivo/react'

const meta: Meta = {
  title: 'Inputs/PromptSuggestions',
}
export default meta
type Story = StoryObj

export const StarterPrompts: Story = {
  name: 'Starter prompts',
  render: () => (
    <PromptSuggestions
      items={['Summarise this week’s tickets', 'Draft a release note', 'What changed in v2?']}
      onSelect={() => {}}
    />
  ),
}
