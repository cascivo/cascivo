import type { Meta, StoryObj } from '@storybook/react-vite'
import { InputGroup, ButtonGroup } from '@cascade-ui/components/input-group'
import { Input } from '@cascade-ui/components/input'
import { Button } from '@cascade-ui/components/button'

const meta: Meta<typeof InputGroup> = {
  component: InputGroup,
}
export default meta
type Story = StoryObj<typeof InputGroup>

export const WithPrefix: Story = {
  render: () => (
    <InputGroup prefix="https://">
      <Input placeholder="example.com" />
    </InputGroup>
  ),
}

export const WithSuffix: Story = {
  render: () => (
    <InputGroup suffix=".com">
      <Input placeholder="Enter domain" />
    </InputGroup>
  ),
}

export const WithBoth: Story = {
  render: () => (
    <InputGroup prefix="$" suffix="USD">
      <Input placeholder="0.00" />
    </InputGroup>
  ),
}

export const WithButtonGroup: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="secondary">Left</Button>
      <Button variant="secondary">Center</Button>
      <Button variant="secondary">Right</Button>
    </ButtonGroup>
  ),
}

export const Accessibility: Story = {
  render: () => (
    <InputGroup prefix="@" suffix=".io">
      <Input label="Username" placeholder="handle" />
    </InputGroup>
  ),
  parameters: { a11y: { test: 'error' } },
}
