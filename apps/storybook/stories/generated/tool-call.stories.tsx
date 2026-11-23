// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, ToolCall } from '@cascivo/react'

const meta: Meta = {
  title: 'Display/ToolCall',
}
export default meta
type Story = StoryObj

export const Running: Story = {
  name: 'Running',
  render: () => (
    <ToolCall name="search_web" status="running" input={'{ "query": "cascivo pricing" }'} />
  ),
}

export const Complete: Story = {
  name: 'Complete',
  render: () => (
    <ToolCall
      name="get_weather"
      status="complete"
      input={'{ "city": "Berlin" }'}
      output={'{ "tempC": 18, "sky": "clear" }'}
    />
  ),
}

export const AwaitingApproval: Story = {
  name: 'Awaiting approval',
  render: () => (
    <ToolCall
      name="send_email"
      status="awaiting-approval"
      input={'{ "to": "team@example.com", "subject": "Weekly report" }'}
      actions={
        <>
          <Button variant="ghost" size="sm">
            Deny
          </Button>
          <Button size="sm">Approve</Button>
        </>
      }
    />
  ),
}

export const Error: Story = {
  name: 'Error',
  render: () => <ToolCall name="fetch_page" status="error" error="The page returned 404." />,
}
