import type { Meta, StoryObj } from '@storybook/react-vite'
import { PageFooter } from '@cascivo/layouts/sections/page-footer'

const meta: Meta<typeof PageFooter> = {
  title: 'Sections/PageFooter',
  component: PageFooter,
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof PageFooter>

const groups = [
  {
    title: 'Product',
    links: [
      { label: 'Components', href: '/components' },
      { label: 'Charts', href: '/charts' },
      { label: 'Layouts', href: '/layouts' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { label: 'Docs', href: '/docs' },
      { label: 'GitHub', href: 'https://github.com/urbanisierung/cascade-ui' },
      { label: 'Changelog', href: '/changelog' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Storybook', href: '/storybook' },
      { label: 'llms.txt', href: '/llms.txt' },
      { label: 'Figma kit', href: '/figma' },
    ],
  },
]

export const Default: Story = {
  render: () => (
    <PageFooter brand="Cascade" meta="MIT licensed. Built with care." groups={groups} />
  ),
}

export const WithoutMeta: Story = {
  render: () => <PageFooter groups={groups} />,
}
