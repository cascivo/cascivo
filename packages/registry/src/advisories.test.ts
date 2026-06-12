import { describe, it, expect } from 'vitest'
import { matchAdvisories } from './advisories.ts'

const advisory = (affectedVersions: string) => ({
  id: 'CSA-001',
  severity: 'high' as const,
  affectedVersions,
  summary: 'test',
})

describe('matchAdvisories', () => {
  it('returns empty when no advisories', () => {
    expect(matchAdvisories({}, '1.0.0')).toHaveLength(0)
  })

  it('matches < range', () => {
    const item = { advisories: [advisory('<1.3.0')] }
    expect(matchAdvisories(item, '1.2.0')).toHaveLength(1)
    expect(matchAdvisories(item, '1.3.0')).toHaveLength(0)
    expect(matchAdvisories(item, '1.4.0')).toHaveLength(0)
  })

  it('matches <= range', () => {
    const item = { advisories: [advisory('<=1.3.0')] }
    expect(matchAdvisories(item, '1.3.0')).toHaveLength(1)
    expect(matchAdvisories(item, '1.4.0')).toHaveLength(0)
  })

  it('matches >= range', () => {
    const item = { advisories: [advisory('>=1.0.0')] }
    expect(matchAdvisories(item, '1.0.0')).toHaveLength(1)
    expect(matchAdvisories(item, '0.9.0')).toHaveLength(0)
  })

  it('matches exact version', () => {
    const item = { advisories: [advisory('1.2.3')] }
    expect(matchAdvisories(item, '1.2.3')).toHaveLength(1)
    expect(matchAdvisories(item, '1.2.4')).toHaveLength(0)
  })

  it('skips malformed range without crashing', () => {
    const item = { advisories: [{ ...advisory('not-a-range-!!') }] }
    expect(() => matchAdvisories(item, '1.0.0')).not.toThrow()
  })
})
