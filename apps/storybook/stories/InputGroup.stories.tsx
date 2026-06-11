import type { Meta, StoryObj } from '@storybook/react-vite'
import { InputGroup, ButtonGroup, InputGroupAddon } from '@cascade-ui/components/input-group'
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

export const WithLeadingIcon: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon>
        <svg viewBox="0 0 16 16" width="16" height="16">
          <circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </InputGroupAddon>
      <Input placeholder="Search components…" aria-label="Search" />
    </InputGroup>
  ),
}

export const WithTrailingUnit: Story = {
  render: () => (
    <InputGroup>
      <Input placeholder="0.00" aria-label="Weight" />
      <InputGroupAddon align="inline-end">kg</InputGroupAddon>
    </InputGroup>
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
