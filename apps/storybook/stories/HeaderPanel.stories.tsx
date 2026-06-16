import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { HeaderPanel } from '@cascivo/components/header-panel'
import { Switcher } from '@cascivo/components/switcher'
import { Button } from '@cascivo/components/button'

const meta: Meta<typeof HeaderPanel> = {
  title: 'Shell/HeaderPanel',
  component: HeaderPanel,
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof HeaderPanel>

export const Primary: Story = {}

export const Default: Story = {
  render() {
    const [open, setOpen] = useState(false)
    return (
      <div style={{ minBlockSize: '400px', padding: '3rem' }}>
        <Button onClick={() => setOpen((v) => !v)}>Toggle panel</Button>
        <HeaderPanel open={open} onClose={() => setOpen(false)} label="Notifications">
          <p style={{ margin: 0 }}>3 unread notifications</p>
        </HeaderPanel>
      </div>
    )
  },
}

export const WithSwitcher: Story = {
  render() {
    const [open, setOpen] = useState(false)
    return (
      <div style={{ minBlockSize: '400px', padding: '3rem' }}>
        <Button onClick={() => setOpen((v) => !v)}>App switcher</Button>
        <HeaderPanel open={open} onClose={() => setOpen(false)} label="Switch application">
          <Switcher
            items={[
              { label: 'Console', href: '#', active: true },
              { label: 'Billing', href: '#' },
              { divider: true },
              { label: 'Documentation', href: '#' },
            ]}
          />
        </HeaderPanel>
      </div>
    )
  },
}

export const Accessibility: Story = {
  render() {
    const [open, setOpen] = useState(true)
    return (
      <div style={{ minBlockSize: '400px' }}>
        <HeaderPanel open={open} onClose={() => setOpen(false)} label="Notifications">
          <p style={{ margin: 0 }}>Panel content</p>
        </HeaderPanel>
      </div>
    )
  },
  parameters: { a11y: { test: 'error' } },
}
