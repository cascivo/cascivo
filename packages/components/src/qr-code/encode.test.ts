import { describe, it, expect } from 'vitest'
import { encode } from './encode'

const isFinder = (m: boolean[][], ox: number, oy: number): boolean => {
  // A finder pattern: dark 7x7 border, light inner ring, dark 3x3 core.
  const dark = (x: number, y: number): boolean => m[oy + y]![ox + x]!
  return (
    dark(0, 0) &&
    dark(6, 0) &&
    dark(0, 6) &&
    dark(6, 6) && // outer corners
    dark(3, 3) && // core centre
    !dark(1, 1) &&
    !dark(5, 5) // inner light ring
  )
}

describe('qr encode', () => {
  it('produces a square version-1 (21×21) matrix for a short value', () => {
    const m = encode('HELLO', 'M')
    expect(m).toHaveLength(21)
    for (const row of m) expect(row).toHaveLength(21)
  })

  it('places the three finder patterns at the corners', () => {
    const m = encode('https://cascivo.dev', 'M')
    const size = m.length
    expect(isFinder(m, 0, 0)).toBe(true) // top-left
    expect(isFinder(m, size - 7, 0)).toBe(true) // top-right
    expect(isFinder(m, 0, size - 7)).toBe(true) // bottom-left
  })

  it('is deterministic for the same input', () => {
    const a = encode('cascivo', 'Q')
    const b = encode('cascivo', 'Q')
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('grows the version (matrix size) as the payload grows', () => {
    const small = encode('a', 'L').length
    const large = encode('x'.repeat(200), 'L').length
    expect(large).toBeGreaterThan(small)
  })

  it('higher error correction never shrinks the matrix for the same value', () => {
    const value = 'https://cascivo.dev/components/qr-code'
    expect(encode(value, 'H').length).toBeGreaterThanOrEqual(encode(value, 'L').length)
  })

  it('throws when the value cannot fit in any version', () => {
    expect(() => encode('z'.repeat(3000), 'H')).toThrow()
  })
})
