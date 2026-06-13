import type { Meta, StoryObj } from '@storybook/react-vite'
import { Hero } from '@cascivo/layouts/sections/hero'

const meta: Meta<typeof Hero> = {
  title: 'Sections/Hero',
  component: Hero,
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof Hero>

const actions = (
  <div style={{ display: 'flex', gap: '0.5rem' }}>
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
      View docs
    </button>
  </div>
)

const media = (
  <div
    style={{
      height: '12rem',
      background: 'var(--cascivo-surface-subtle)',
      border: '1px solid var(--cascivo-color-border)',
      borderRadius: 'var(--cascivo-radius-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.75rem',
    }}
  >
    Media / demo
  </div>
)

export const Centered: Story = {
  args: {
    variant: 'centered',
    eyebrow: 'v8 — Assembly Included',
    title: 'Ship the dashboard your ops team deserves',
    description:
      'Cascade gives you charts, layouts, and sections — fully composed, copy-paste ready.',
    actions,
  },
}

export const Split: Story = {
  args: {
    variant: 'split',
    eyebrow: 'v8 — Assembly Included',
    title: 'Signal-driven, CSS-native',
    description: 'Fine-grained reactivity with zero re-renders. Beautiful by default.',
    actions,
    media,
  },
}
