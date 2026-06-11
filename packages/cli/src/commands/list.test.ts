import { describe, expect, it } from 'vitest'
import type { RegistryComponent } from '../utils/registry.js'
import { formatList } from './list.js'

const components: RegistryComponent[] = [
  {
    name: 'button',
    description: 'Triggers an action',
    category: 'inputs',
    version: '0.0.0',
    files: [],
    dependencies: [],
    tags: [],
  },
  {
    name: 'card',
    description: 'A surface',
    category: 'display',
    version: '0.0.0',
    files: [],
    dependencies: [],
    tags: [],
  },
]

const typedComponents: RegistryComponent[] = [
  {
    name: 'button',
    type: 'component',
    description: 'Triggers an action',
    category: 'inputs',
    version: '0.0.0',
    files: [],
    dependencies: [],
    tags: [],
  },
  {
    name: 'layout/app-shell',
    type: 'layout',
    description: 'Full-page app shell',
    category: 'layout',
    version: '0.0.0',
    files: [],
    dependencies: [],
    tags: [],
  },
  {
    name: 'block/users-table',
    type: 'block',
    description: 'Users data table',
    category: 'display',
    version: '0.0.0',
    files: [],
    dependencies: [],
    tags: [],
  },
]

describe('formatList', () => {
  it('renders an aligned table with a header', () => {
    const out = formatList(components)
    const lines = out.split('\n')
    expect(lines[0]).toMatch(/^Name\s+Category\s+Description$/)
    expect(out).toContain('button')
    expect(out).toContain('card')
  })

  it('pads the name column to align rows', () => {
    const lines = formatList(components).split('\n')
    const buttonRow = lines.find((l) => l.startsWith('button'))!
    expect(buttonRow).toMatch(/^button\s{2,}inputs/)
  })

  it('handles an empty list', () => {
    expect(formatList([])).toBe('No components found.')
  })

  it('groups output by type with section headers', () => {
    const out = formatList(typedComponents)
    expect(out).toContain('Components')
    expect(out).toContain('Layouts')
    expect(out).toContain('Blocks')
  })

  it('places each entry under its correct type section', () => {
    const out = formatList(typedComponents)
    const componentsIdx = out.indexOf('Components')
    const layoutsIdx = out.indexOf('Layouts')
    const blocksIdx = out.indexOf('Blocks')
    const buttonIdx = out.indexOf('button')
    const appShellIdx = out.indexOf('layout/app-shell')
    const usersTableIdx = out.indexOf('block/users-table')

    // Each entry should appear after its section header and before the next one.
    expect(buttonIdx).toBeGreaterThan(componentsIdx)
    expect(buttonIdx).toBeLessThan(layoutsIdx)
    expect(appShellIdx).toBeGreaterThan(layoutsIdx)
    expect(appShellIdx).toBeLessThan(blocksIdx)
    expect(usersTableIdx).toBeGreaterThan(blocksIdx)
  })

  it('renders flat (no section headers) when no entries have a type', () => {
    const out = formatList(components)
    expect(out).not.toContain('Components')
    expect(out).not.toContain('Layouts')
  })
})
