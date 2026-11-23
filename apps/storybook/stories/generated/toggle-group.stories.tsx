// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ToggleGroup } from '@cascivo/react'

const meta: Meta = {
  title: "Inputs/ToggleGroup",
}
export default meta
type Story = StoryObj

export const SingleSelection: Story = {
  name: "Single selection",
  render: () => (
    <ToggleGroup type="single" defaultValue="left" items={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }]} />
  ),
}

export const MultipleSelection: Story = {
  name: "Multiple selection",
  render: () => (
    <ToggleGroup type="multiple" defaultValue={["bold"]} items={[{ value: "bold", label: "Bold" }, { value: "italic", label: "Italic" }]} />
  ),
}

