import { describe, expect, it } from 'vitest'
import { compareVersions, satisfiesFloor } from './semver.js'

describe('compareVersions', () => {
  it('orders by major, then minor, then patch', () => {
    expect(compareVersions('0.1.11', '0.2.0')).toBe(-1)
    expect(compareVersions('0.2.1', '0.2.0')).toBe(1)
    expect(compareVersions('0.2.0', '0.2.0')).toBe(0)
    expect(compareVersions('1.0.0', '0.9.9')).toBe(1)
  })

  it('throws on unparsable input', () => {
    expect(() => compareVersions('not-a-version', '0.2.0')).toThrow()
  })
})

describe('satisfiesFloor', () => {
  it('reproduces the reported DataTable/i18n incident: 0.1.11 does not satisfy >=0.2.0', () => {
    expect(satisfiesFloor('0.1.11', '>=0.2.0')).toBe(false)
    expect(satisfiesFloor('0.2.1', '>=0.2.0')).toBe(true)
    expect(satisfiesFloor('0.2.0', '>=0.2.0')).toBe(true)
  })

  it('does not block on unrecognized floor shapes or unparsable installed versions', () => {
    expect(satisfiesFloor('0.2.1', 'workspace:^')).toBe(true)
    expect(satisfiesFloor('workspace:^', '>=0.2.0')).toBe(true)
  })
})
