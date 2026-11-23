// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { QrCode } from '@cascivo/react'

const meta: Meta = {
  title: "Display/QrCode",
}
export default meta
type Story = StoryObj

export const URL: Story = {
  name: "URL",
  render: () => (
    <QrCode value="https://cascivo.dev" />
  ),
}

export const HighErrorCorrection: Story = {
  name: "High error correction",
  render: () => (
    <QrCode value="https://cascivo.dev" errorCorrection="H" size={200} />
  ),
}

export const CustomColors: Story = {
  name: "Custom colors",
  render: () => (
    <QrCode value="cascivo" fill="var(--cascivo-color-accent)" background="var(--cascivo-color-surface)" />
  ),
}

