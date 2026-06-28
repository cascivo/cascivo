import { describe, it, expect } from 'vitest'
import type { RegistryItem } from './types.ts'
import { isTemplateItem, asTemplateMeta, validateTemplate } from './template.ts'

const VALID_TEMPLATE: RegistryItem = {
  schemaVersion: 2,
  name: 'dashboard',
  type: 'template',
  description: 'An analytics dashboard template',
  version: '1.0.0',
  license: 'MIT',
  files: [
    { url: 'https://example.com/dashboard.tsx', target: 'src/pages/dashboard.tsx' },
    { url: 'https://example.com/fixtures.ts', target: 'src/fixtures/dashboard.ts' },
  ],
  dependencies: [],
  registryDependencies: ['card', 'line-chart'],
  tags: ['dashboard'],
  meta: {
    intent: 'Analytics dashboard',
    framework: 'react-vite',
    category: 'dashboard',
    screenshots: [{ light: 'https://example.com/light.png', alt: 'Dashboard preview' }],
    demoUrl: 'https://example.github.io/demo',
    fileRoles: {
      'src/pages/dashboard.tsx': 'page',
      'src/fixtures/dashboard.ts': 'fixture',
    },
    pages: [{ name: 'Dashboard', target: 'src/pages/dashboard.tsx' }],
  },
}

describe('isTemplateItem', () => {
  it('is true for a template item', () => {
    expect(isTemplateItem(VALID_TEMPLATE)).toBe(true)
  })

  it('is false for a component item', () => {
    expect(isTemplateItem({ ...VALID_TEMPLATE, type: 'component' })).toBe(false)
  })
})

describe('validateTemplate', () => {
  it('accepts a well-formed template', () => {
    expect(validateTemplate(VALID_TEMPLATE)).toEqual([])
  })

  it('rejects a non-template item', () => {
    const errors = validateTemplate({ ...VALID_TEMPLATE, type: 'component' })
    expect(errors.some((e) => e.includes("type must be 'template'"))).toBe(true)
  })

  it('fails when screenshots are missing', () => {
    const errors = validateTemplate({
      ...VALID_TEMPLATE,
      meta: { ...(VALID_TEMPLATE.meta as object), screenshots: [] },
    })
    expect(errors.some((e) => e.includes('screenshots'))).toBe(true)
  })

  it('fails when a screenshot lacks alt text', () => {
    const errors = validateTemplate({
      ...VALID_TEMPLATE,
      meta: {
        ...(VALID_TEMPLATE.meta as object),
        screenshots: [{ light: 'https://example.com/x.png' }],
      },
    })
    expect(errors.some((e) => e.includes('alt'))).toBe(true)
  })

  it('fails when license is missing', () => {
    const { license: _, ...rest } = VALID_TEMPLATE
    const errors = validateTemplate(rest as RegistryItem)
    expect(errors.some((e) => e.includes('license'))).toBe(true)
  })

  it('fails when framework is invalid', () => {
    const errors = validateTemplate({
      ...VALID_TEMPLATE,
      meta: { ...(VALID_TEMPLATE.meta as object), framework: 'vue' },
    })
    expect(errors.some((e) => e.includes('framework'))).toBe(true)
  })

  it('fails when a file target is missing from fileRoles', () => {
    const errors = validateTemplate({
      ...VALID_TEMPLATE,
      files: [
        ...VALID_TEMPLATE.files,
        { url: 'https://example.com/extra.ts', target: 'src/extra.ts' },
      ],
    })
    expect(errors.some((e) => e.includes('src/extra.ts') && e.includes('fileRoles'))).toBe(true)
  })

  it('fails when a fileRole value is invalid', () => {
    const errors = validateTemplate({
      ...VALID_TEMPLATE,
      meta: {
        ...(VALID_TEMPLATE.meta as object),
        fileRoles: {
          'src/pages/dashboard.tsx': 'widget',
          'src/fixtures/dashboard.ts': 'fixture',
        },
      },
    })
    expect(errors.some((e) => e.includes('fileRoles'))).toBe(true)
  })

  it('fails when there are no components and no page file', () => {
    const errors = validateTemplate({
      ...VALID_TEMPLATE,
      registryDependencies: [],
      files: [{ url: 'https://example.com/fixtures.ts', target: 'src/fixtures/dashboard.ts' }],
      meta: {
        ...(VALID_TEMPLATE.meta as object),
        fileRoles: { 'src/fixtures/dashboard.ts': 'fixture' },
      },
    })
    expect(errors.some((e) => e.includes('at least one component'))).toBe(true)
  })

  it('passes with a page file and no components', () => {
    const errors = validateTemplate({
      ...VALID_TEMPLATE,
      registryDependencies: [],
    })
    expect(errors).toEqual([])
  })
})

describe('asTemplateMeta', () => {
  it('narrows valid meta', () => {
    const meta = asTemplateMeta(VALID_TEMPLATE.meta)
    expect(meta.category).toBe('dashboard')
  })

  it('throws on invalid meta', () => {
    expect(() => asTemplateMeta({ intent: 'x' })).toThrow('Invalid TemplateMeta')
  })
})
