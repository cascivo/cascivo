// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, ButtonGroup } from '@cascivo/react'

const meta: Meta = {
  title: "Inputs/ButtonGroup",
}
export default meta
type Story = StoryObj

export const JoinedActions: Story = {
  name: "Joined actions",
  render: () => (
    <ButtonGroup aria-label="Text alignment"><Button>Left</Button><Button>Center</Button><Button>Right</Button></ButtonGroup>
  ),
}

export const VerticalWithRovingFocus: Story = {
  name: "Vertical with roving focus",
  render: () => (
    <ButtonGroup orientation="vertical" roving aria-label="View"><Button>List</Button><Button>Grid</Button></ButtonGroup>
  ),
}

