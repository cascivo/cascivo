import { describe, it, expect } from 'vitest'
import { shadcnName, toShadcnItem } from './shadcn.ts'
import type { RegistryItem } from './types.ts'

const sample: RegistryItem = {
  schemaVersion: 2,
  name: 'button',
  type: 'component',
  description: 'Triggers an action or event',
  category: 'inputs',
  version: '0.0.0',
  files: [
    { url: 'https://raw.githubusercontent.com/x/main/packages/components/src/button/button.tsx' },
    {
      url: 'https://raw.githubusercontent.com/x/main/packages/components/src/button/button.module.css',
    },
  ],
  dependencies: ['@cascivo/core'],
  tags: ['action'],
}

describe('toShadcnItem', () => {
  it('maps a component to a registry:component item with files', () => {
    const out = toShadcnItem(sample)
    expect(out.$schema).toMatch(/registry-item\.json$/)
    expect(out.name).toBe('button')
    expect(out.type).toBe('registry:component')
    expect(out.files).toHaveLength(2)
    expect(out.files[0]).toMatchObject({ path: 'button/button.tsx', type: 'registry:component' })
    expect(out.dependencies).toContain('@cascivo/core')
    expect(out.categories).toEqual(['inputs'])
  })

  it('inlines file content when a resolver is provided', () => {
    const out = toShadcnItem(sample, {
      resolveContent: (url) =>
        url.endsWith('.tsx') ? 'export const Button = () => null' : undefined,
    })
    expect(out.files[0]?.content).toBe('export const Button = () => null')
    expect(out.files[1]?.content).toBeUndefined()
  })

  it('does not populate Tailwind-only fields (cascivo is CSS-native)', () => {
    const out = toShadcnItem(sample) as Record<string, unknown>
    expect(out['cssVars']).toBeUndefined()
    expect(out['tailwind']).toBeUndefined()
  })

  it('flattens prefixed names and maps block-like types', () => {
    const out = toShadcnItem({ ...sample, name: 'block/auth-login', type: 'block' })
    expect(out.name).toBe('block-auth-login')
    expect(out.type).toBe('registry:block')
  })

  it('is deterministic for the same input', () => {
    expect(JSON.stringify(toShadcnItem(sample))).toBe(JSON.stringify(toShadcnItem(sample)))
  })
})

describe('shadcnName', () => {
  it('replaces slashes with dashes', () => {
    expect(shadcnName('chart/bar-chart')).toBe('chart-bar-chart')
    expect(shadcnName('button')).toBe('button')
  })
})
