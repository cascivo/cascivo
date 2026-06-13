import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '@cascivo/components/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@cascivo/components/card'

const meta: Meta<typeof Card> = {
  title: 'Display/Card',
  component: Card,
}
export default meta
type Story = StoryObj<typeof Card>

const body = (
  <>
    <CardHeader>
      <CardTitle>Card title</CardTitle>
    </CardHeader>
    <CardContent>Cards group related content. This one shows the default layout.</CardContent>
    <CardFooter>
      <Button size="sm" variant="ghost">
        Learn more
      </Button>
    </CardFooter>
  </>
)

export const Default: Story = { args: { children: body } }
export const Outlined: Story = { args: { variant: 'outlined', children: body } }
export const Elevated: Story = { args: { variant: 'elevated', children: body } }

export const AllPaddings: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16, maxWidth: 420 }}>
      {(['none', 'sm', 'md', 'lg'] as const).map((padding) => (
        <Card key={padding} padding={padding}>
          <CardContent>padding="{padding}"</CardContent>
        </Card>
      ))}
    </div>
  ),
}

export const Accessibility: Story = {
  args: { children: body },
  parameters: { a11y: { test: 'error' } },
}
