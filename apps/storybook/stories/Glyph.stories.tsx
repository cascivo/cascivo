import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Glyph, type GlyphName } from '@cascivo/icons'
// Pure-CSS glyphs ship their paint as a standalone stylesheet (the Glyph
// component is side-effect-free). Import it by relative path — the bare
// `@cascivo/icons` specifier is aliased to the package source, so a
// `@cascivo/icons/glyphs.css` subpath import would not resolve here.
import '../../../packages/icons/src/glyphs.css'

const GLYPHS: GlyphName[] = [
  'chevron-down',
  'chevron-up',
  'chevron-left',
  'chevron-right',
  'x',
  'check',
  'plus',
  'minus',
  'menu',
  'arrow-right',
  'arrow-left',
  'arrow-up',
  'arrow-down',
]

const meta: Meta<typeof Glyph> = {
  title: 'Icons/Glyph',
  component: Glyph,
  args: { name: 'chevron-down', size: 32 },
  argTypes: {
    name: { control: 'select', options: [...GLYPHS, 'chevron-toggle'] },
    size: { control: { type: 'number' } },
    open: { control: 'boolean' },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Pure-CSS glyphs — a `background: currentColor` span clipped by `clip-path: shape()`, no SVG. ' +
          'They inherit text color, size via `--cascivo-glyph-size`, and can morph between states with a ' +
          'CSS transition. Requires `import "@cascivo/icons/glyphs.css"` once in the app.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Glyph>

/** Interactive controls — pick any glyph, size it, toggle the morph state. */
export const Playground: Story = {}

/** Every v1 glyph at a glance. */
export const Gallery: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, maxWidth: 560 }}>
      {GLYPHS.map((name) => (
        <div
          key={name}
          style={{
            display: 'grid',
            placeItems: 'center',
            gap: 6,
            width: 100,
            padding: 12,
            border: '1px solid var(--cascivo-color-border, #e5e7eb)',
            borderRadius: 8,
          }}
        >
          <Glyph name={name} size={32} />
          <small style={{ fontFamily: 'system-ui', fontSize: 12, opacity: 0.7 }}>{name}</small>
        </div>
      ))}
    </div>
  ),
}

/** currentColor inheritance + `--cascivo-glyph-size` scaling. */
export const ColorAndSize: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <Glyph name="check" size={16} />
      <Glyph name="check" size={24} />
      <Glyph name="check" size={40} />
      <span style={{ color: 'var(--cascivo-color-accent, #2563eb)' }}>
        <Glyph name="check" size={40} />
      </span>
      <span style={{ color: 'crimson' }}>
        <Glyph name="x" size={40} />
      </span>
    </div>
  ),
}

/**
 * Zero-JS morph: the shape animates via `transition: clip-path` when `open`
 * flips — no animation library, no keyframes in JS. Click to toggle.
 */
export const Morph: Story = {
  name: 'Morph — chevron-toggle',
  render: () => {
    const [open, setOpen] = useState(false)
    return (
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          fontFamily: 'system-ui',
          fontSize: 14,
          cursor: 'pointer',
          border: '1px solid var(--cascivo-color-border, #e5e7eb)',
          borderRadius: 8,
          background: 'transparent',
          color: 'inherit',
        }}
        aria-expanded={open}
      >
        <Glyph name="chevron-toggle" open={open} size={20} />
        {open ? 'Collapse' : 'Expand'}
      </button>
    )
  },
}
