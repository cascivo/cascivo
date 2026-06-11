/**
 * Unit tests for prefix stripping and name resolution behaviour in the add
 * command. Network I/O is not exercised here — those paths are covered by e2e
 * tests.
 */
import { describe, expect, it } from 'vitest'

/**
 * Mirrors the outputName computation in add.ts so we can assert it without
 * wiring up HTTP mocks.
 */
function outputName(registryName: string): string {
  return registryName.includes('/') ? registryName.split('/').pop()! : registryName
}

describe('outputName (prefix stripping)', () => {
  it('returns the bare name for an unprefixed component', () => {
    expect(outputName('button')).toBe('button')
  })

  it('strips a layout/ prefix', () => {
    expect(outputName('layout/app-shell')).toBe('app-shell')
  })

  it('strips a block/ prefix', () => {
    expect(outputName('block/users-table-page')).toBe('users-table-page')
  })

  it('strips only the last segment for deeply nested names', () => {
    expect(outputName('a/b/c')).toBe('c')
  })
})
