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

  // Regressions: the walk used to advance past the base line after a pure insertion, so that
  // line vanished from the result, and the misalignment then lost the other side's edits.
  it('a local insertion keeps the line after it, and upstream edits elsewhere', () => {
    const base = 'A\nB\nC\nD\nE'
    const local = 'A\nmine\nB\nC\nD\nE'
    const upstream = 'A\nB\nC\nD-up\nE\nF'
    expect(merge(base, local, upstream)).toEqual({
      text: 'A\nmine\nB\nC\nD-up\nE\nF',
      conflicts: 0,
    })
  })

  it('insertions on both sides at different places both land', () => {
    const base = 'A\nB\nC'
    const local = 'L\nA\nB\nC'
    const upstream = 'A\nB\nU\nC'
    expect(merge(base, local, upstream)).toEqual({ text: 'L\nA\nB\nU\nC', conflicts: 0 })
  })

  it('different insertions at the same point conflict', () => {
    const result = merge('A\nB', 'A\nL\nB', 'A\nU\nB')
    expect(result.conflicts).toBe(1)
    expect(result.text).toBe('A\n<<<<<<< local\nL\n=======\nU\n>>>>>>> upstream\nB')
  })

  it('a deletion on one side and an edit elsewhere on the other both apply', () => {
    const base = 'A\nB\nC\nD'
    expect(merge(base, 'A\nC\nD', 'A\nB\nC\nD2')).toEqual({ text: 'A\nC\nD2', conflicts: 0 })
  })
})
