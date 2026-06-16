import type { Meta, StoryObj } from '@storybook/react-vite'
import { Editable } from '@cascivo/components/editable'

const meta: Meta<typeof Editable> = {
  title: 'Inputs/Editable',
  component: Editable,
  args: { value: 'Click to edit', onValueChange: () => {} },
}
export default meta
type Story = StoryObj<typeof Editable>

export const Primary: Story = {}

export const Default: Story = {}
export const Empty: Story = { args: { value: '', placeholder: 'Enter title…' } }
export const Disabled: Story = { args: { disabled: true } }
export const NoSubmitOnBlur: Story = { args: { submitOnBlur: false } }

export const Accessibility: Story = {
  args: { value: 'Editable text' },
  parameters: { a11y: { test: 'error' } },
}
