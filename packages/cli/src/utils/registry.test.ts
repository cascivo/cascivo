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
      description: 'Triggers an action or event',
      category: 'inputs',
      version: '0.0.0',
      files: [
        'https://example.com/button/button.tsx',
        'https://example.com/button/button.module.css',
      ],
      dependencies: ['@cascade-ui/core'],
      tags: ['action', 'form', 'interactive'],
    },
    {
      name: 'card',
      description: 'A surface that groups related content',
      category: 'display',
      version: '0.0.0',
      files: ['https://example.com/card/card.tsx'],
      dependencies: [],
      tags: ['container', 'surface'],
    },
  ],
}

describe('parseRegistry', () => {
  it('parses a valid registry', () => {
    const registry = parseRegistry(RAW)
    expect(registry.components).toHaveLength(2)
    expect(registry.components[0]?.name).toBe('button')
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
