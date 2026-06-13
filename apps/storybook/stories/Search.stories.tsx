import type { Meta, StoryObj } from '@storybook/react-vite'
import { Search } from '@cascivo/components/search'

const meta: Meta<typeof Search> = {
  title: 'Inputs/Search',
  component: Search,
}
export default meta
type Story = StoryObj<typeof Search>

export const Default: Story = {}

export const WithValue: Story = { args: { defaultValue: 'design tokens' } }

export const Disabled: Story = { args: { disabled: true } }

export const CustomPlaceholder: Story = {
  args: { label: 'Search products', placeholder: 'Search products…' },
}

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 }}>
      <Search size="sm" label="Small search" />
      <Search size="md" label="Medium search" />
      <Search size="lg" label="Large search" />
    </div>
  ),
}

export const Accessibility: Story = {
  args: { defaultValue: 'cascade' },
  parameters: { a11y: { test: 'error' } },
}
