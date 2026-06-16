import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '@cascivo/components/button'
import { Dropdown } from '@cascivo/components/dropdown'

const items = [
  { label: 'Edit', value: 'edit' },
  { label: 'Duplicate', value: 'duplicate' },
  { separator: true, label: '', value: 'sep' },
  { label: 'Delete', value: 'delete' },
]

const meta: Meta<typeof Dropdown> = {
  title: 'Overlay/Dropdown',
  component: Dropdown,
}
export default meta
type Story = StoryObj<typeof Dropdown>

export const Primary: Story = {}

export const Default: Story = {
  render: () => <Dropdown trigger={<Button>Actions ▾</Button>} items={items} />,
}

export const WithDisabledItem: Story = {
  render: () => (
    <Dropdown
      trigger={<Button variant="secondary">More ▾</Button>}
      items={[
        { label: 'Rename', value: 'rename' },
        { label: 'Archive', value: 'archive', disabled: true },
        { label: 'Delete', value: 'delete' },
      ]}
    />
  ),
}

export const EndPlacement: Story = {
  render: () => (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Dropdown trigger={<Button>Aligned end ▾</Button>} items={items} placement="bottom-end" />
    </div>
  ),
}

export const Accessibility: Story = {
  render: () => <Dropdown trigger={<Button>Menu ▾</Button>} items={items} />,
  parameters: { a11y: { test: 'error' } },
}
