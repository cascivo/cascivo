import { createRequire } from 'node:module'
import type { ComponentType } from 'react'
import { describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import * as icons from './index'
import { Check, ChevronDown, X } from './index'

/** Every named export that is a renderable icon component. */
function iconComponents(): [string, ComponentType<Record<string, unknown>>][] {
  return Object.entries(icons).filter(
    ([name, v]) => typeof v === 'function' && name !== 'createIcon' && name !== 'VERSION',
  ) as [string, ComponentType<Record<string, unknown>>][]
}

describe('@cascivo/icons', () => {
  it('exports VERSION', () => {
    expect(icons.VERSION).toBe('0.0.0')
  })

  it('exports the expanded catalog (~440 icons)', () => {
    expect(iconComponents().length).toBeGreaterThanOrEqual(430)
  })

  it('renders a 24×24 svg with currentColor stroke by default', () => {
    const { container } = render(<ChevronDown />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '24')
    expect(svg).toHaveAttribute('height', '24')
    expect(svg).toHaveAttribute('stroke', 'currentColor')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('honors size, color, and className props', () => {
    const { container } = render(<X size={16} color="#f00" className="my-icon" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '16')
    expect(svg).toHaveAttribute('stroke', '#f00')
    expect(svg).toHaveClass('my-icon')
  })

  it('drops aria-hidden when an aria-label is given', () => {
    const { container } = render(<Check aria-label="Done" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-label', 'Done')
    expect(svg).not.toHaveAttribute('aria-hidden')
  })

  it('renders every exported icon as a stroked 24×24 currentColor svg', () => {
    for (const [name, Icon] of iconComponents()) {
      const { container } = render(<Icon />)
      const svg = container.querySelector('svg')
      expect(svg, name).not.toBeNull()
      expect(svg, name).toHaveAttribute('viewBox', '0 0 24 24')
      expect(svg, name).toHaveAttribute('stroke', 'currentColor')
      expect(svg, name).toHaveAttribute('aria-hidden', 'true')
      // Non-empty geometry — normalization kept the inner markup.
      expect(
        svg?.querySelector('path, line, circle, polyline, polygon, rect, ellipse'),
        name,
      ).not.toBeNull()
      cleanup()
    }
  })

  it('opts out of aria-hidden for every icon when labelled', () => {
    for (const [name, Icon] of iconComponents()) {
      const { container } = render(<Icon aria-label={name} />)
      const svg = container.querySelector('svg')
      expect(svg, name).toHaveAttribute('aria-label', name)
      expect(svg, name).not.toHaveAttribute('aria-hidden')
      cleanup()
    }
  })

  it('has no duplicate display names', () => {
    const names = iconComponents().map(([, Icon]) => (Icon as { displayName?: string }).displayName)
    expect(new Set(names).size).toBe(names.length)
  })

  it('spot-checks newly generated chromicons render geometry', () => {
    const sample = ['Briefcase', 'Camera', 'Anchor', 'Aperture', 'Box'] as const
    for (const name of sample) {
      const Icon = (icons as Record<string, ComponentType>)[name]
      expect(Icon, name).toBeTypeOf('function')
      const { container } = render(<Icon />)
      expect(
        container.querySelector('svg path, svg line, svg circle, svg polyline'),
        name,
      ).not.toBeNull()
      cleanup()
    }
  })

  it('stays tree-shakeable — sideEffects is false', () => {
    const require = createRequire(import.meta.url)
    const pkg = require('../package.json') as { sideEffects?: unknown }
    expect(pkg.sideEffects).toBe(false)
  })

  const newIcons = [
    'Bell',
    'Home',
    'Dashboard',
    'Users',
    'Grid',
    'HelpCircle',
    'LogOut',
    'Folder',
    'File',
    'Filter',
    'BarChart',
    'Globe',
    'Lock',
    'Server',
    'Terminal',
    'Database',
    'Key',
    'Shield',
    'CreditCard',
    'Inbox',
    'Tag',
    'Zap',
    'Layers',
    'Activity',
  ] as const

  it.each(newIcons)('exports %s icon', (name) => {
    const Icon = (icons as Record<string, unknown>)[name]
    expect(Icon).toBeTypeOf('function')
  })
})
