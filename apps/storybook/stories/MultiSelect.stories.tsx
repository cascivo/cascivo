import type { Meta, StoryObj } from '@storybook/react-vite'
import { MultiSelect } from '@cascivo/components/multi-select'

const options = [
  { label: 'React', value: 'react' },
  { label: 'Vue', value: 'vue' },
  { label: 'Svelte', value: 'svelte' },
  { label: 'Angular', value: 'angular', disabled: true },
]

const grouped = [
  { label: 'React', value: 'react', group: 'Libraries' },
  { label: 'Preact', value: 'preact', group: 'Libraries' },
  { label: 'Vue', value: 'vue', group: 'Frameworks' },
  { label: 'Svelte', value: 'svelte', group: 'Frameworks' },
  { label: 'Angular', value: 'angular', group: 'Frameworks' },
]

const meta: Meta<typeof MultiSelect> = {
  title: 'Inputs/MultiSelect',
  component: MultiSelect,
  args: {
    options,
    defaultValue: [],
    placeholder: 'Select frameworks',
  },
}
export default meta
type Story = StoryObj<typeof MultiSelect>

export const Primary: Story = {}

export const Default: Story = {}
export const WithSelection: Story = { args: { defaultValue: ['react', 'vue'] } }
export const Disabled: Story = { args: { disabled: true } }

/** Controlled by a parent — the value never changes because onValueChange is ignored. */
export const Controlled: Story = { args: { value: ['react'], onValueChange: () => {} } }

export const Chips: Story = {
  args: { display: 'chips', defaultValue: ['react', 'vue'], clearable: true },
}

export const Grouped: Story = { args: { options: grouped } }

export const SelectAll: Story = { args: { selectAll: true, clearable: true } }

export const Bounded: Story = { args: { max: 2, selectAll: true } }

export const Creatable: Story = {
  args: { creatable: true, onCreate: () => {}, display: 'chips' },
}

export const Loading: Story = { args: { options: [], loading: true } }

export const WithoutSearch: Story = { args: { searchable: false } }

export const Sizes: Story = {
  args: { size: 'sm' },
}

export const WithLabelAndHint: Story = {
  args: { label: 'Frameworks', hint: 'Pick the ones your team uses' },
}

export const WithError: Story = {
  args: { label: 'Frameworks', error: 'Pick at least one' },
}

export const Accessibility: Story = {
  args: { defaultValue: ['react'], label: 'Frameworks' },
  parameters: { a11y: { test: 'error' } },
}
