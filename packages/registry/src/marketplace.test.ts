import { describe, it, expect } from 'vitest'
import type { RegistryItem } from './types.ts'
import { projectTemplate, buildCatalog, type MarketplaceSource } from './marketplace.ts'

function template(name: string, category = 'dashboard'): RegistryItem {
  return {
    schemaVersion: 2,
    name,
    type: 'template',
    description: `${name} template`,
    version: '1.0.0',
    license: 'MIT',
    files: [{ url: `https://example.com/${name}.tsx`, target: `src/pages/${name}.tsx` }],
    dependencies: [],
    registryDependencies: ['card'],
    tags: [category, 'template'],
    meta: {
      intent: `${name}`,
      framework: 'react-vite',
      category,
      screenshots: [{ light: `https://example.com/${name}.png`, alt: name }],
      demoUrl: `https://example.com/demo/${name}`,
      fileRoles: { [`src/pages/${name}.tsx`]: 'page' },
    },
  }
}

const component: RegistryItem = {
  schemaVersion: 2,
  name: 'card',
  type: 'component',
  description: 'A card',
  version: '1.0.0',
  files: [{ url: 'https://example.com/card.tsx' }],
  dependencies: [],
  tags: [],
}

describe('projectTemplate', () => {
  it('projects a template into a gallery record', () => {
    const rec = projectTemplate(template('dashboard'), { namespace: '@acme', verified: true })
    expect(rec).toMatchObject({
      name: 'dashboard',
      namespace: '@acme',
      installSpec: '@acme/dashboard',
      framework: 'react-vite',
      verified: true,
      demoUrl: 'https://example.com/demo/dashboard',
    })
  })

  it('returns null for a non-template item', () => {
    expect(projectTemplate(component, { namespace: '@acme' })).toBeNull()
  })

  it('returns null for a template with malformed meta', () => {
    const bad = { ...template('x'), meta: { intent: 'x' } }
    expect(projectTemplate(bad, { namespace: '@acme' })).toBeNull()
  })
})

describe('buildCatalog', () => {
  const sources: MarketplaceSource[] = [
    {
      entry: { namespace: '@acme', verified: false, stars: 5 },
      items: [template('landing', 'marketing'), component],
    },
    {
      entry: { namespace: '@cascivo', verified: true, stars: 1 },
      items: [template('dashboard', 'dashboard')],
    },
  ]

  it('collects only templates and derives facets', () => {
    const cat = buildCatalog(sources, '2026-06-28')
    expect(cat.templates.map((t) => t.name)).toContain('dashboard')
    expect(cat.templates.map((t) => t.name)).toContain('landing')
    expect(cat.templates).toHaveLength(2)
    expect(cat.facets.categories).toEqual(['dashboard', 'marketing'])
    expect(cat.facets.frameworks).toEqual(['react-vite'])
  })

  it('sorts verified first, then by stars desc, then name', () => {
    const cat = buildCatalog(sources, '2026-06-28')
    // @cascivo/dashboard is verified → first, despite fewer stars.
    expect(cat.templates[0]!.name).toBe('dashboard')
  })

  it('stamps the generatedAt timestamp', () => {
    expect(buildCatalog(sources, '2026-06-28').generatedAt).toBe('2026-06-28')
  })
})
