// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Filter } from '@cascivo/react'

const meta: Meta = {
  title: 'Inputs/Filter',
}
export default meta
type Story = StoryObj

export const SingleSelect: Story = {
  name: 'Single-select',
  render: () => (
    <Filter
      options={[
        { label: 'All', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
      ]}
      aria-label="Filter by status"
    />
  ),
}

export const MultiSelect: Story = {
  name: 'Multi-select',
  render: () => (
    <Filter
      multi
      options={[
        { label: 'Design', value: 'design' },
        { label: 'Engineering', value: 'engineering' },
        { label: 'Marketing', value: 'marketing' },
      ]}
      aria-label="Filter by team"
    />
  ),
}

export const OutlineVariant: Story = {
  name: 'Outline variant',
  render: () => (
    <Filter
      variant="outline"
      options={[
        { label: 'React', value: 'react' },
        { label: 'Vue', value: 'vue' },
      ]}
      aria-label="Filter by framework"
    />
  ),
}
