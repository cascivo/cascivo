import { describe, it, expect } from 'vitest'
import { validateDirectory } from './directory.ts'

const VALID_DIR = {
  schemaVersion: 1,
  registries: [
    {
      namespace: '@cascade',
      name: 'cascade (first-party)',
      description: 'The official cascade registry.',
      homepage: 'https://cascade-ui.dev',
      registryUrl: 'https://cascade-ui.dev/r/{name}.json',
      tags: ['official'],
      verified: true,
    },
  ],
}

describe('validateDirectory', () => {
  it('accepts a valid directory', () => {
    const result = validateDirectory(VALID_DIR)
    expect(result.ok).toBe(true)
  })

  it('fails on wrong schemaVersion', () => {
    const result = validateDirectory({ ...VALID_DIR, schemaVersion: 2 })
    expect(result.ok).toBe(false)
  })

  it('fails on missing namespace', () => {
    const result = validateDirectory({
      ...VALID_DIR,
      registries: [{ ...VALID_DIR.registries[0], namespace: undefined }],
    })
    expect(result.ok).toBe(false)
  })

  it('fails on duplicate namespace', () => {
    const result = validateDirectory({
      ...VALID_DIR,
      registries: [VALID_DIR.registries[0], VALID_DIR.registries[0]],
    })
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('Duplicate'))).toBe(true)
  })

  it('fails when registryUrl lacks {name}', () => {
    const result = validateDirectory({
      ...VALID_DIR,
      registries: [{ ...VALID_DIR.registries[0], registryUrl: 'https://example.com/r/' }],
    })
    expect(result.ok).toBe(false)
  })

  it('warns on similar namespaces', () => {
    const result = validateDirectory({
      schemaVersion: 1,
      registries: [
        { ...VALID_DIR.registries[0], namespace: '@cascade' },
        {
          ...VALID_DIR.registries[0],
          namespace: '@cascde',
          name: 'other',
          registryUrl: 'https://other.dev/r/{name}.json',
        },
      ],
    })
    expect(result.warnings.some((w) => w.includes('similar'))).toBe(true)
  })
})
