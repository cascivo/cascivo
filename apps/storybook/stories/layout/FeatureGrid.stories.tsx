import type { Meta, StoryObj } from '@storybook/react-vite'
import { FeatureGrid } from '@cascade-ui/layouts/sections/feature-grid'

const meta: Meta<typeof FeatureGrid> = {
  title: 'Sections/FeatureGrid',
  component: FeatureGrid,
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof FeatureGrid>

const items = [
  {
    title: 'Zero config',
    description: 'Copy a component and it works — no providers, no wrappers.',
  },
  {
    title: 'Token-first',
    description: 'Every color, size and radius is a CSS custom property you own.',
  },
  {
    title: 'Signal-driven',
    description: 'Fine-grained reactivity with @preact/signals-react — zero re-renders.',
  },
  {
    title: 'Accessible',
    description: 'WCAG 2.1 AA, keyboard navigable, logical CSS properties for RTL.',
  },
  {
    title: 'Copy-paste',
    description: 'Components are yours — no vendor lock-in, no hidden abstractions.',
  },
  {
    title: 'AI-first',
    description: 'Machine-readable manifests power the MCP server, CLI, and docs.',
  },
]

export const Default: Story = {
  render: () => <FeatureGrid title="Built for production" items={items} />,
}

export const WithLinks: Story = {
  render: () => (
    <FeatureGrid title="Explore" items={items.map((item) => ({ ...item, href: '#' }))} />
  ),
}

export const WithoutHeader: Story = {
  render: () => <FeatureGrid items={items} />,
}
