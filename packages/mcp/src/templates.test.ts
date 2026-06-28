import { describe, it, expect } from 'vitest'
import { listTemplates, getTemplate, type MarketplaceCatalog } from './templates.js'

const CATALOG: MarketplaceCatalog = {
  generatedAt: '2026-06-28',
  templates: [
    {
      name: 'dashboard',
      namespace: '@cascivo',
      description: 'Analytics dashboard',
      category: 'dashboard',
      framework: 'react-vite',
      tags: ['dashboard', 'template'],
      components: ['card', 'line-chart'],
      screenshots: [{ light: 'l.png', alt: 'preview' }],
      version: '1.0.0',
      license: 'MIT',
      verified: true,
      installSpec: '@cascivo/dashboard',
    },
    {
      name: 'landing',
      namespace: '@acme',
      description: 'Marketing landing',
      category: 'marketing',
      framework: 'react-next',
      tags: ['marketing'],
      components: ['button'],
      screenshots: [{ light: 'l2.png', alt: 'preview' }],
      version: '1.0.0',
      license: 'MIT',
      verified: false,
      installSpec: '@acme/landing',
    },
  ],
  facets: {
    categories: ['dashboard', 'marketing'],
    frameworks: ['react-vite', 'react-next'],
    tags: [],
  },
}

describe('listTemplates', () => {
  it('returns all templates with no filter', () => {
    expect(listTemplates(CATALOG)).toHaveLength(2)
  })

  it('filters by category', () => {
    const r = listTemplates(CATALOG, { category: 'dashboard' })
    expect(r.map((t) => t.name)).toEqual(['dashboard'])
  })

  it('filters by framework', () => {
    expect(listTemplates(CATALOG, { framework: 'react-next' }).map((t) => t.name)).toEqual([
      'landing',
    ])
  })

  it('filters by tag', () => {
    expect(listTemplates(CATALOG, { tag: 'marketing' }).map((t) => t.name)).toEqual(['landing'])
  })

  it('filters by verifiedOnly', () => {
    expect(listTemplates(CATALOG, { verifiedOnly: true }).map((t) => t.name)).toEqual(['dashboard'])
  })
})

describe('getTemplate', () => {
  it('finds by name', () => {
    expect(getTemplate(CATALOG, 'landing')?.namespace).toBe('@acme')
  })

  it('finds by install spec', () => {
    expect(getTemplate(CATALOG, '@cascivo/dashboard')?.name).toBe('dashboard')
  })

  it('returns undefined when missing', () => {
    expect(getTemplate(CATALOG, 'nope')).toBeUndefined()
  })
})
