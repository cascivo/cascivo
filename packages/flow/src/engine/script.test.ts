import { describe, expect, it } from 'vitest'
import { resolveScript, resolveStep } from './script.ts'
import type { FlowEdge } from './types.ts'

const edges: FlowEdge[] = [
  { id: 'ab', source: 'A', target: 'B' },
  { id: 'bc', source: 'B', target: 'C' },
]

describe('resolveStep', () => {
  it('resolves A→B forward on the ab edge', () => {
    expect(resolveStep({ from: 'A', to: 'B', label: 'go' }, edges)).toEqual({
      edgeId: 'ab',
      direction: 'forward',
      label: 'go',
      description: undefined,
      duration: undefined,
    })
  })

  it('resolves B→A as the same edge in reverse', () => {
    const r = resolveStep({ from: 'B', to: 'A' }, edges)
    expect(r.edgeId).toBe('ab')
    expect(r.direction).toBe('reverse')
  })

  it('passes through an explicit edge step', () => {
    expect(resolveStep({ edge: 'bc', reverse: true }, edges)).toMatchObject({
      edgeId: 'bc',
      direction: 'reverse',
    })
  })

  it('throws on an unknown pair', () => {
    expect(() => resolveStep({ from: 'A', to: 'C' }, edges)).toThrow(/no edge connects/)
  })

  it('throws on an unknown edge id', () => {
    expect(() => resolveStep({ edge: 'zz' }, edges)).toThrow(/unknown edge/)
  })
})

describe('resolveScript', () => {
  it('resolves the A<->B-->C storyboard', () => {
    const resolved = resolveScript(
      [
        { from: 'A', to: 'B' },
        { from: 'B', to: 'A' },
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C' },
      ],
      edges,
    )
    expect(resolved.map((s) => `${s.edgeId}:${s.direction}`)).toEqual([
      'ab:forward',
      'ab:reverse',
      'ab:forward',
      'bc:forward',
    ])
  })
})
