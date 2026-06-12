import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { validateItem, validateIndex, parseLegacyRegistry } from './validate.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(HERE, '..', '..', '..')

const VALID_ITEM = {
  schemaVersion: 2 as const,
  name: 'button',
  type: 'component' as const,
  description: 'A button component',
  version: '1.0.0',
  files: [{ url: 'https://example.com/button.tsx' }],
  dependencies: [],
  tags: ['input'],
}

describe('validateItem', () => {
  it('accepts a valid v2 item', () => {
    const result = validateItem(VALID_ITEM)
    expect(result.ok).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('fails when schemaVersion is wrong', () => {
    const result = validateItem({ ...VALID_ITEM, schemaVersion: 1 })
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('schemaVersion'))).toBe(true)
  })

  it('fails when name is missing', () => {
    const { name: _, ...rest } = VALID_ITEM
    const result = validateItem(rest)
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('name'))).toBe(true)
  })

  it('fails when type is invalid', () => {
    const result = validateItem({ ...VALID_ITEM, type: 'widget' })
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('type'))).toBe(true)
  })

  it('fails when files is missing', () => {
    const { files: _, ...rest } = VALID_ITEM
    const result = validateItem(rest)
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('files'))).toBe(true)
  })

  it('warns on unknown fields', () => {
    const result = validateItem({ ...VALID_ITEM, unknownProp: true })
    expect(result.ok).toBe(true)
    expect(result.warnings.some((w) => w.includes('unknownProp'))).toBe(true)
  })

  it('validates advisory fields', () => {
    const result = validateItem({
      ...VALID_ITEM,
      advisories: [
        {
          id: 'CSA-001',
          severity: 'high',
          affectedVersions: '<1.0.0',
          summary: 'Test advisory',
        },
      ],
    })
    expect(result.ok).toBe(true)
  })

  it('fails on duplicate advisory ids', () => {
    const result = validateItem({
      ...VALID_ITEM,
      advisories: [
        { id: 'CSA-001', severity: 'low', affectedVersions: '<1.0.0', summary: 'A' },
        { id: 'CSA-001', severity: 'low', affectedVersions: '<1.0.0', summary: 'B' },
      ],
    })
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('CSA-001'))).toBe(true)
  })
})

describe('validateIndex', () => {
  it('accepts a valid index', () => {
    const result = validateIndex({ schemaVersion: 2, name: 'test', items: [VALID_ITEM] })
    expect(result.ok).toBe(true)
  })

  it('fails when items is not an array', () => {
    const result = validateIndex({ schemaVersion: 2, name: 'test', items: null })
    expect(result.ok).toBe(false)
  })

  it('bubbles item errors with index prefix', () => {
    const result = validateIndex({
      schemaVersion: 2,
      name: 'test',
      items: [{ ...VALID_ITEM, schemaVersion: 1 }],
    })
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.startsWith('items[0]'))).toBe(true)
  })
})

describe('parseLegacyRegistry', () => {
  it('lifts legacy registry to v2 index', async () => {
    const raw = JSON.parse(await readFile(join(REPO_ROOT, 'registry.json'), 'utf8')) as unknown
    const index = parseLegacyRegistry(raw)
    expect(index.schemaVersion).toBe(2)
    expect(index.items.length).toBeGreaterThan(0)
    for (const item of index.items) {
      expect(item.schemaVersion).toBe(2)
      expect(typeof item.name).toBe('string')
      expect(Array.isArray(item.files)).toBe(true)
    }
  })
})
