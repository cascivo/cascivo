import type { Meta, StoryObj } from '@storybook/react-vite'
import { RatingGroup } from '@cascade-ui/components/rating-group'

const meta: Meta<typeof RatingGroup> = {
  component: RatingGroup,
  args: { value: 3, onValueChange: () => {} },
}
export default meta
type Story = StoryObj<typeof RatingGroup>

export const Default: Story = {}
export const ReadOnly: Story = { args: { value: 4, readOnly: true } }
export const Small: Story = { args: { size: 'sm' } }
export const Large: Story = { args: { size: 'lg' } }
export const TenStars: Story = { args: { max: 10, value: 7 } }
export const Disabled: Story = { args: { disabled: true } }

export const Accessibility: Story = {
  args: { value: 4 },
  parameters: { a11y: { test: 'error' } },
}
