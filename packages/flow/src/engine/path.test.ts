import { describe, expect, it } from 'vitest'
import { bezierPath, edgePath, smoothStepPath, straightPath } from './path.ts'

describe('path builders', () => {
  it('straightPath', () => {
    const { d, mid } = straightPath({ source: { x: 0, y: 0 }, target: { x: 100, y: 40 } })
    expect(d).toBe('M0,0 L100,40')
    expect(mid).toEqual({ x: 50, y: 20 })
  })

  it('bezierPath offsets control points along handle normals', () => {
    const { d, mid } = bezierPath({
      source: { x: 0, y: 0 },
      target: { x: 100, y: 0 },
      sourcePosition: 'right',
      targetPosition: 'left',
    })
    expect(d).toBe('M0,0 C25,0 75,0 100,0')
    expect(mid).toEqual({ x: 50, y: 0 })
  })

  it('smoothStepPath routes orthogonally with rounded corners', () => {
    const { d, mid } = smoothStepPath({
      source: { x: 0, y: 0 },
      target: { x: 100, y: 100 },
      sourcePosition: 'right',
      targetPosition: 'left',
    })
    expect(d).toBe('M0,0 L42,0 Q50,0 50,8 L50,92 Q50,100 58,100 L100,100')
    expect(mid).toEqual({ x: 50, y: 50 })
  })

  it('edgePath dispatches by type', () => {
    const params = { source: { x: 0, y: 0 }, target: { x: 10, y: 0 } }
    expect(edgePath('straight', params).d).toBe('M0,0 L10,0')
    expect(edgePath('bezier', params).d.startsWith('M0,0 C')).toBe(true)
    expect(edgePath('smoothstep', params).d.startsWith('M0,0')).toBe(true)
  })
})
