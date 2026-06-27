import type { Meta, StoryObj } from '@storybook/react-vite'
import { Sankey } from '@cascivo/charts'

const nodes = [
  { id: 'search', label: 'Search' },
  { id: 'social', label: 'Social' },
  { id: 'home', label: 'Home' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'signup', label: 'Signup' },
  { id: 'paid', label: 'Paid' },
]
const links = [
  { source: 'search', target: 'home', value: 50 },
  { source: 'social', target: 'home', value: 30 },
  { source: 'home', target: 'pricing', value: 45 },
  { source: 'pricing', target: 'signup', value: 28 },
  { source: 'signup', target: 'paid', value: 12 },
]

const meta: Meta<typeof Sankey> = {
  title: 'Charts/Sankey',
  component: Sankey,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (S) => (
      <div style={{ inlineSize: 'min(48rem, 90vw)', padding: '2rem' }}>
        <S />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof Sankey>

export const Default: Story = {
  args: { nodes, links, title: 'Acquisition flow', height: 320, tooltip: true },
}
