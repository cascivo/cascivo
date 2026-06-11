import type { Meta, StoryObj } from '@storybook/react-vite'
import { ConsoleApp } from '@cascade-ui/layouts/blocks/console-app/console-app'

const meta: Meta<typeof ConsoleApp> = {
  component: ConsoleApp,
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof ConsoleApp>

export const Default: Story = {}
