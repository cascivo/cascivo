import type { Meta, StoryObj } from '@storybook/react-vite'
import { Cta } from '@cascivo/layouts/sections/cta'

const meta: Meta<typeof Cta> = {
  title: 'Sections/Cta',
  component: Cta,
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof Cta>

const actions = (
  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
    <button
      style={{
        padding: '0.5rem 1rem',
        background: 'var(--cascivo-color-accent)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--cascivo-radius-sm)',
        cursor: 'pointer',
      }}
    >
      Get started
    </button>
    <button
      style={{
        padding: '0.5rem 1rem',
        background: 'transparent',
        border: '1px solid var(--cascivo-color-border)',
        borderRadius: 'var(--cascivo-radius-sm)',
        cursor: 'pointer',
      }}
    >
      View on GitHub
    </button>
  </div>
)

export const Default: Story = {
  args: {
    title: 'Ready to ship?',
    description: 'Add Cascade to your project in minutes — copy-paste or install via CLI.',
    actions,
  },
}

export const TitleOnly: Story = {
  args: {
    title: 'Start building with Cascade.',
  },
}
