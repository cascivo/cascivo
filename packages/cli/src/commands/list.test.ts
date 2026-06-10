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
})
