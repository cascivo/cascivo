import type { Meta, StoryObj } from '@storybook/react-vite'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@cascivo/components/hover-card'

const meta: Meta = {
  title: 'Overlay/HoverCard',
}
export default meta
type Story = StoryObj

export const Primary: Story = {}

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger>
        <a href="#" style={{ textDecoration: 'underline' }}>
          @cascivo
        </a>
      </HoverCardTrigger>
      <HoverCardContent>
        <div>
          <strong>cascivo</strong>
          <p style={{ margin: '0.25rem 0 0' }}>
            CSS-native, signal-driven, AI-first React design system.
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
}

export const Accessibility: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger>
        <button type="button">Hover for preview</button>
      </HoverCardTrigger>
      <HoverCardContent>
        <p style={{ margin: 0 }}>Preview content</p>
      </HoverCardContent>
    </HoverCard>
  ),
  parameters: { a11y: { test: 'error' } },
}
