import type { Meta, StoryObj } from '@storybook/react-vite'
import { ConsoleApp } from '@cascivo/layouts/blocks/console-app/console-app'

const meta: Meta<typeof ConsoleApp> = {
  title: 'Shell/ConsoleApp',
  component: ConsoleApp,
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof ConsoleApp>

export const Default: Story = {}
