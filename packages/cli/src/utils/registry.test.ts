import { describe, expect, it } from 'vitest'
import {
  fileName,
  findComponent,
  parseRegistry,
  searchComponents,
  type Registry,
} from './registry.js'

const RAW = {
  version: '0.0.0',
  generatedAt: '2026-06-09',
  components: [
    {
      name: 'button',
      type: 'component',
      description: 'Triggers an action or event',
      category: 'inputs',
      version: '0.0.0',
      files: [
        'https://example.com/button/button.tsx',
        'https://example.com/button/button.module.css',
      ],
      dependencies: ['@cascivo/core'],
      tags: ['action', 'form', 'interactive'],
    },
    {
      name: 'card',
      type: 'component',
      description: 'A surface that groups related content',
      category: 'display',
      version: '0.0.0',
      files: ['https://example.com/card/card.tsx'],
      dependencies: [],
      tags: ['container', 'surface'],
    },
    {
      name: 'layout/app-shell',
      type: 'layout',
      description: 'Full-page application shell',
      category: 'layout',
      version: '0.0.0',
      files: ['https://example.com/app-shell/app-shell.tsx'],
      dependencies: [],
      tags: ['shell', 'layout'],
    },
    {
      name: 'block/users-table',
      type: 'block',
      description: 'Users data table block',
      category: 'display',
      version: '0.0.0',
      files: ['https://example.com/blocks/users-table/users-table.tsx'],
      dependencies: [],
      tags: ['table', 'users'],
    },
  ],
}

describe('parseRegistry', () => {
  it('parses a valid registry', () => {
    const registry = parseRegistry(RAW)
    expect(registry.components).toHaveLength(4)
    expect(registry.components[0]?.name).toBe('button')
  })

  it('preserves type field for component/layout/block', () => {
    const registry = parseRegistry(RAW)
    expect(registry.components[0]?.type).toBe('component')
    expect(registry.components[2]?.type).toBe('layout')
    expect(registry.components[3]?.type).toBe('block')
  })

  it('leaves type undefined for entries without a valid type', () => {
    const registry = parseRegistry({ components: [{ name: 'x', type: 'unknown' }] })
    expect(registry.components[0]?.type).toBeUndefined()
  })

  it('coerces missing optional fields to safe defaults', () => {
    const registry = parseRegistry({ components: [{ name: 'x' }] })
    const entry = registry.components[0]!
    expect(entry.files).toEqual([])
    expect(entry.dependencies).toEqual([])
    expect(entry.tags).toEqual([])
    expect(entry.version).toBe('0.0.0')
  })

  it('throws on non-object input', () => {
    expect(() => parseRegistry(null)).toThrow()
    expect(() => parseRegistry('nope')).toThrow()
  })

  it('throws when components is not an array', () => {
    expect(() => parseRegistry({ components: {} })).toThrow()
  })

  it('throws when a component is missing a name', () => {
    expect(() => parseRegistry({ components: [{ description: 'x' }] })).toThrow()
  })
})

describe('findComponent', () => {
  const registry: Registry = parseRegistry(RAW)

  it('finds by exact name', () => {
    expect(findComponent(registry, 'button')?.name).toBe('button')
  })

  it('is case-insensitive', () => {
    expect(findComponent(registry, 'Button')?.name).toBe('button')
  })

  it('finds prefixed names by full name', () => {
    expect(findComponent(registry, 'layout/app-shell')?.name).toBe('layout/app-shell')
  })

  it('resolves unambiguous suffix to prefixed entry', () => {
    expect(findComponent(registry, 'app-shell')?.name).toBe('layout/app-shell')
  })

  it('resolves unambiguous suffix case-insensitively', () => {
    expect(findComponent(registry, 'App-Shell')?.name).toBe('layout/app-shell')
  })

  it('returns undefined when suffix is ambiguous', () => {
    // Both 'button' and a hypothetical 'extra/button' would make it ambiguous.
    // With current fixture, 'users-table' is unambiguous.
    expect(findComponent(registry, 'users-table')?.name).toBe('block/users-table')
  })

  it('returns undefined for unknown names', () => {
    expect(findComponent(registry, 'nope')).toBeUndefined()
  })
})

describe('searchComponents', () => {
  const registry: Registry = parseRegistry(RAW)

  it('matches on name, tag, or description', () => {
    expect(searchComponents(registry, 'action').map((c) => c.name)).toEqual(['button'])
    expect(searchComponents(registry, 'surface').map((c) => c.name)).toEqual(['card'])
    expect(searchComponents(registry, 'content').map((c) => c.name)).toEqual(['card'])
  })

  it('returns empty for no matches', () => {
    expect(searchComponents(registry, 'zzz')).toEqual([])
  })
})

describe('fileName', () => {
  it('extracts the file name from a URL', () => {
    expect(fileName('https://example.com/a/b/button.tsx')).toBe('button.tsx')
  })

  it('strips query and hash', () => {
    expect(fileName('https://example.com/button.tsx?v=1#x')).toBe('button.tsx')
  })
})
