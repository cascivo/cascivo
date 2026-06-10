import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@cascade-ui/components/tabs'

const meta: Meta<typeof Tabs> = {
  component: Tabs,
}
export default meta
type Story = StoryObj<typeof Tabs>

const tabs = (
  <>
    <TabsList>
      <TabsTrigger value="account">Account</TabsTrigger>
      <TabsTrigger value="password">Password</TabsTrigger>
      <TabsTrigger value="team">Team</TabsTrigger>
    </TabsList>
    <TabsContent value="account">Manage your account settings and preferences.</TabsContent>
    <TabsContent value="password">Update your password and security options.</TabsContent>
    <TabsContent value="team">Invite teammates and manage their roles.</TabsContent>
  </>
)

export const Default: Story = {
  render: () => <Tabs defaultValue="account">{tabs}</Tabs>,
}

export const SecondTabActive: Story = {
  render: () => <Tabs defaultValue="password">{tabs}</Tabs>,
}

export const WithDisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="general">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="billing" disabled>
          Billing
        </TabsTrigger>
        <TabsTrigger value="danger">Danger zone</TabsTrigger>
      </TabsList>
      <TabsContent value="general">General settings.</TabsContent>
      <TabsContent value="billing">Billing settings.</TabsContent>
      <TabsContent value="danger">Irreversible actions.</TabsContent>
    </Tabs>
  ),
}

export const Accessibility: Story = {
  render: () => <Tabs defaultValue="account">{tabs}</Tabs>,
  parameters: { a11y: { test: 'error' } },
}
