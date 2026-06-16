import type { Meta, StoryObj } from '@storybook/react-vite'
import { Link } from '@cascivo/components/link'

const meta: Meta<typeof Link> = {
  title: 'Navigation/Link',
  component: Link,
  args: { children: 'View documentation', href: '#' },
}
export default meta
type Story = StoryObj<typeof Link>

export const Primary: Story = {}

export const Standalone: Story = {}
export const External: Story = {
  args: { external: true, href: 'https://example.com', children: 'Example.com' },
}

export const Inline: Story = {
  render: () => (
    <p style={{ maxWidth: 400 }}>
      Cascade components are copy-pasted into your project, so you own the code. Read the{' '}
      <Link variant="inline" href="#">
        getting started guide
      </Link>{' '}
      to learn more.
    </p>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Link size="sm" href="#">
        Small
      </Link>
      <Link size="md" href="#">
        Medium
      </Link>
      <Link size="lg" href="#">
        Large
      </Link>
    </div>
  ),
}

export const Accessibility: Story = {
  args: { children: 'View documentation', href: '#' },
  parameters: {
    a11y: { test: 'error' },
  },
}
