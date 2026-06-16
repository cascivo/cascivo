import type { Meta, StoryObj } from '@storybook/react-vite'
import { Breadcrumb } from '@cascivo/components/breadcrumb'

const meta: Meta<typeof Breadcrumb> = {
  title: 'Navigation/Breadcrumb',
  component: Breadcrumb,
  parameters: { layout: 'fullscreen' },
  args: {
    items: [
      { label: 'Home', href: '#' },
      { label: 'Docs', href: '#' },
      { label: 'Components', href: '#' },
      { label: 'Breadcrumb' },
    ],
  },
}
export default meta
type Story = StoryObj<typeof Breadcrumb>

export const Primary: Story = {}

export const Basic: Story = {}

export const TwoLevels: Story = {
  args: {
    items: [{ label: 'Home', href: '#' }, { label: 'Settings' }],
  },
}

export const Collapsed: Story = {
  args: {
    maxVisible: 3,
    items: [
      { label: 'Home', href: '#' },
      { label: 'Docs', href: '#' },
      { label: 'Components', href: '#' },
      { label: 'Navigation', href: '#' },
      { label: 'Breadcrumb' },
    ],
  },
}

export const WithoutLinks: Story = {
  args: {
    items: [{ label: 'Home' }, { label: 'Docs' }, { label: 'Breadcrumb' }],
  },
}

export const Accessibility: Story = {
  parameters: {
    a11y: { test: 'error' },
  },
}
