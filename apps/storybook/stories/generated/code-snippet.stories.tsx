// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { CodeSnippet } from '@cascivo/react'

const meta: Meta = {
  title: "Display/CodeSnippet",
}
export default meta
type Story = StoryObj

export const InstallCommand: Story = {
  name: "Install command",
  render: () => (
    <CodeSnippet code="npx cascivo add button" language="bash" />
  ),
}

export const Inline: Story = {
  name: "Inline",
  render: () => (
    <p>Run <CodeSnippet variant="inline" code="pnpm build" /> first.</p>
  ),
}

export const TerminalBlock: Story = {
  name: "Terminal block",
  render: () => (
    <CodeSnippet
      variant="multi"
      language="bash"
      terminal
      title="deploy.sh"
      code={'pnpm build\npnpm deploy'}
    />
  ),
}

