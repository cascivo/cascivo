import type { Meta, StoryObj } from '@storybook/react-vite'
import { Header } from '@cascade-ui/components/header'
import { Button } from '@cascade-ui/components/button'

const meta: Meta<typeof Header> = {
  title: 'Navigation/Header',
  component: Header,
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof Header>

const links = [
  { label: 'Docs', href: '#docs' },
  { label: 'Components', href: '#components', active: true },
  { label: 'Themes', href: '#themes' },
  { label: 'Blog', href: '#blog' },
]

export const Default: Story = {
  args: {
    brand: <a href="#home">cascade</a>,
    links,
  },
}

export const WithActions: Story = {
  args: {
    brand: <a href="#home">cascade</a>,
    links,
    actions: (
      <>
        <Button variant="ghost" size="sm">
          Sign in
        </Button>
        <Button size="sm">Get started</Button>
      </>
    ),
  },
}

export const BrandOnly: Story = {
  args: {
    brand: <a href="#home">cascade</a>,
  },
}

export const Sticky: Story = {
  render: () => (
    <div style={{ height: 240, overflow: 'auto', border: '1px solid #ccc' }}>
      <Header sticky brand={<a href="#home">cascade</a>} links={links} />
      <div style={{ height: 800, padding: 16 }}>Scroll me — the header stays pinned.</div>
    </div>
  ),
}

export const NarrowContainer: Story = {
  render: () => (
    <div style={{ inlineSize: 480 }}>
      <Header brand={<a href="#home">cascade</a>} links={links} />
    </div>
  ),
}

export const Accessibility: Story = {
  args: {
    brand: <a href="#home">cascade</a>,
    links,
    actions: <Button size="sm">Get started</Button>,
  },
  parameters: {
    a11y: { test: 'error' },
  },
}
