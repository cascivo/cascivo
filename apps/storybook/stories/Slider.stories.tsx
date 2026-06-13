import type { Meta, StoryObj } from '@storybook/react-vite'
import { Slider } from '@cascivo/components/slider'

const meta: Meta<typeof Slider> = {
  title: 'Inputs/Slider',
  component: Slider,
  args: { label: 'Volume', defaultValue: 60 },
}
export default meta
type Story = StoryObj<typeof Slider>

export const Default: Story = {}
export const Stepped: Story = {
  args: { label: 'Brightness', min: 0, max: 100, step: 10, defaultValue: 50 },
}
export const CustomRange: Story = {
  args: { label: 'Price', min: 10, max: 500, defaultValue: 250 },
}
export const Disabled: Story = { args: { disabled: true } }

export const Accessibility: Story = {
  args: { label: 'Font size', min: 12, max: 24, defaultValue: 16 },
  parameters: { a11y: { test: 'error' } },
}
