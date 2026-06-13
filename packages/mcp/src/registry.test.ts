import { describe, expect, it } from 'vitest'
import { getComponent, listComponents, searchComponents, type Registry } from './registry.js'

const registry: Registry = {
  version: '0.0.0',
  generatedAt: '2026-06-09',
  components: [
    {
      name: 'button',
      description: 'Triggers an action or event',
      category: 'inputs',
      version: '0.0.0',
      files: ['https://example.com/button/button.tsx'],
      dependencies: ['@cascivo/core'],
      tags: ['action', 'form', 'interactive'],
      meta: {
        name: 'Button',
        description: 'Triggers an action or event',
        category: 'inputs',
        states: ['idle', 'loading'],
        variants: ['primary', 'secondary'],
        sizes: ['sm', 'md', 'lg'],
        props: [{ name: 'variant', type: 'string', required: false }],
        tokens: ['--cascivo-color-accent'],
        accessibility: { role: 'button', wcag: 'AA', keyboard: ['Enter', 'Space'] },
        examples: [{ title: 'Primary', code: '<Button>Click</Button>' }],
        dependencies: ['@cascivo/core'],
        tags: ['action', 'form', 'interactive'],
      },
    },
    {
      name: 'alert',
      description: 'Highlights a short, important message inline',
      category: 'display',
      version: '0.0.0',
      files: [],
      dependencies: [],
      tags: ['notification', 'feedback'],
      meta: {
        name: 'Alert',
        description: 'Highlights a short, important message inline',
        category: 'display',
        states: [],
        variants: ['info', 'success'],
        sizes: [],
        props: [],
        tokens: [],
        accessibility: { role: 'alert', wcag: 'AA', keyboard: [] },
        examples: [],
        dependencies: ['@cascivo/core'],
        tags: ['notification', 'feedback'],
      },
    },
  ],
}

describe('listComponents', () => {
  it('returns all manifests by default', () => {
    expect(listComponents(registry).map((m) => m.name)).toEqual(['Button', 'Alert'])
  })

  it('filters by category', () => {
    expect(listComponents(registry, 'display').map((m) => m.name)).toEqual(['Alert'])
    expect(listComponents(registry, 'overlay')).toEqual([])
  })
})

describe('getComponent', () => {
  it('finds by registry name (case-insensitive)', () => {
    expect(getComponent(registry, 'Button')?.name).toBe('Button')
    expect(getComponent(registry, 'button')?.props).toHaveLength(1)
  })

  it('returns undefined for unknown names', () => {
    expect(getComponent(registry, 'nope')).toBeUndefined()
  })
})

describe('searchComponents', () => {
  it('matches name, tag, or description', () => {
    expect(searchComponents(registry, 'action').map((m) => m.name)).toEqual(['Button'])
    expect(searchComponents(registry, 'message').map((m) => m.name)).toEqual(['Alert'])
    expect(searchComponents(registry, 'feedback').map((m) => m.name)).toEqual(['Alert'])
  })

  it('returns empty for blank or unmatched queries', () => {
    expect(searchComponents(registry, '   ')).toEqual([])
    expect(searchComponents(registry, 'zzz')).toEqual([])
  })
})
