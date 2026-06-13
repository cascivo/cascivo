import type { Meta, StoryObj } from '@storybook/react-vite'
import { Section } from '@cascivo/layouts/section'

const meta: Meta<typeof Section> = {
  title: 'Layout/Section',
  component: Section,
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof Section>

const placeholder = (label: string, h = '4rem') => (
  <div
    style={{
      height: h,
      background: 'var(--cascivo-surface-subtle)',
      border: '1px solid var(--cascivo-color-border)',
      borderRadius: 'var(--cascivo-radius-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.75rem',
    }}
  >
    {label}
  </div>
)

export const ContentWidth: Story = {
  render: () => (
    <Section width="content" gap={6}>
      {placeholder('Header', '3rem')}
      {placeholder('Body', '8rem')}
      {placeholder('Footer', '3rem')}
    </Section>
  ),
}

export const WideWidth: Story = {
  render: () => (
    <Section width="wide" gap={6}>
      {placeholder('Header', '3rem')}
      {placeholder('Body', '8rem')}
    </Section>
  ),
}

export const FullWidth: Story = {
  render: () => (
    <Section width="full" gap={4}>
      {placeholder('Full-width content', '6rem')}
    </Section>
  ),
}
