import type { Meta, StoryObj } from '@storybook/react-vite'
import { MultiSelect } from '@cascade-ui/components/multi-select'

const options = [
  { label: 'React', value: 'react' },
  { label: 'Vue', value: 'vue' },
  { label: 'Svelte', value: 'svelte' },
  { label: 'Angular', value: 'angular', disabled: true },
]

const meta: Meta<typeof MultiSelect> = {
  title: 'Inputs/MultiSelect',
  component: MultiSelect,
  args: {
    options,
    value: [],
    onValueChange: () => {},
    placeholder: 'Select frameworks',
  },
}
export default meta
type Story = StoryObj<typeof MultiSelect>

export const Default: Story = {}
export const WithSelection: Story = { args: { value: ['react', 'vue'] } }
export const Disabled: Story = { args: { disabled: true } }

export const Accessibility: Story = {
  args: { value: ['react'] },
  parameters: { a11y: { test: 'error' } },
}
