import type { Meta, StoryObj } from '@storybook/react-vite'
import { TagsInput } from '@cascade-ui/components/tags-input'

const meta: Meta<typeof TagsInput> = {
  title: 'Inputs/TagsInput',
  component: TagsInput,
  args: { value: ['react', 'vue'], onValueChange: () => {} },
}
export default meta
type Story = StoryObj<typeof TagsInput>

export const Default: Story = {}
export const Empty: Story = { args: { value: [], placeholder: 'Add tag…' } }
export const WithValidation: Story = {
  args: { validate: (t) => t.length >= 2, value: [] },
}
export const Disabled: Story = { args: { disabled: true } }
export const WithMax: Story = { args: { max: 3 } }

export const Accessibility: Story = {
  args: { value: ['tag1'] },
  parameters: { a11y: { test: 'error' } },
}
