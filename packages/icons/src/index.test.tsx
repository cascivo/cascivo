import { createRequire } from 'node:module'
import type { ComponentType } from 'react'
import { describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import * as icons from './index'
import { Check, ChevronDown, X } from './index'

/** Every named export that is a renderable icon component. */
function iconComponents(): [string, ComponentType<Record<string, unknown>>][] {
  return Object.entries(icons).filter(
    ([name, v]) =>
      typeof v === 'function' && name !== 'createIcon' && name !== 'VERSION' && name !== 'Glyph',
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

/**
 * Per-icon subpaths (`@cascivo/icons/icons/<Name>`) must be SELF-CONTAINED.
 *
 * Tree-shaking off the barrel already works, so these subpaths exist only for consumers
 * whose bundler does not tree-shake well (2026-07-28 report C8). A first attempt emitted
 * them as re-exports from the barrel, which built into 443 entries all importing one 108 kB
 * shared chunk — pulling the whole icon set behind every subpath and making the feature
 * pointless for exactly the audience it targets. This asserts the property that matters.
 */
describe('per-icon subpath entries', () => {
  it('generates one entry module per exported icon', async () => {
    const { readFileSync, readdirSync } = await import('node:fs')
    const { join } = await import('node:path')
    // `import.meta.url` is an http: URL under vitest, not file:, so resolve from the
    // package root (vitest's cwd) rather than from this module.
    const dir = join(process.cwd(), 'src/single')
    const entries = JSON.parse(readFileSync(`${dir}/entries.json`, 'utf8')) as string[]
    const files = readdirSync(dir).filter((f) => f.endsWith('.tsx'))
    expect(files.length).toBe(entries.length)
    expect(entries.length).toBeGreaterThanOrEqual(440)
  })

  it('generated-icon entries define their icon rather than re-exporting the barrel', async () => {
    const { readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const dir = join(process.cwd(), 'src/single')
    // A generated icon: must call createIcon itself, so its built chunk carries one icon.
    const source = readFileSync(`${dir}/AccessPolicy.tsx`, 'utf8')
    expect(source).toContain("import { createIcon } from '../create-icon'")
    expect(source).toContain('createIcon(')
    expect(source).not.toContain("from '../generated'")
  })
})
