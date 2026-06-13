import { describe, it, expect } from 'vitest'
import { merge } from './merge.js'

describe('three-way merge', () => {
  it('local unchanged — fast-forwards to upstream', () => {
    const base = 'line1\nline2\nline3'
    const local = base
    const upstream = 'line1\nline2-changed\nline3'
    const result = merge(base, local, upstream)
    expect(result.conflicts).toBe(0)
    expect(result.text).toBe(upstream)
  })

  it('upstream unchanged — keeps local', () => {
    const base = 'line1\nline2\nline3'
    const local = 'line1\nmy-change\nline3'
    const upstream = base
    const result = merge(base, local, upstream)
    expect(result.conflicts).toBe(0)
    expect(result.text).toBe(local)
  })

  it('local and upstream edit different lines — clean merge', () => {
    const base = 'A\nB\nC\nD'
    const local = 'A\nB-local\nC\nD'
    const upstream = 'A\nB\nC\nD-upstream'
    const result = merge(base, local, upstream)
    expect(result.conflicts).toBe(0)
    expect(result.text).toContain('B-local')
    expect(result.text).toContain('D-upstream')
  })

  it('same-region collision — produces conflict markers', () => {
    const base = 'A\nB\nC'
    const local = 'A\nB-local\nC'
    const upstream = 'A\nB-upstream\nC'
    const result = merge(base, local, upstream)
    expect(result.conflicts).toBeGreaterThan(0)
    expect(result.text).toContain('<<<<<<< local')
    expect(result.text).toContain('=======')
    expect(result.text).toContain('>>>>>>> upstream')
  })

  it('identical edits by both — clean merge with combined result', () => {
    const base = 'A\nB\nC'
    const local = 'A\nSAME\nC'
    const upstream = 'A\nSAME\nC'
    const result = merge(base, local, upstream)
    expect(result.conflicts).toBe(0)
    expect(result.text).toContain('SAME')
  })
})
