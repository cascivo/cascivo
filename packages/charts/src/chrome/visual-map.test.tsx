import { describe, expect, it } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { signal } from '@cascivo/core'
import { sequentialRamp } from '../engine/ramp'
import {
  VisualMap,
  mapVisual,
  pieceIndex,
  visualVisible,
  type VisualMapOptions,
} from './visual-map'

const cont: VisualMapOptions = { min: 0, max: 100, mode: 'continuous', channel: 'color' }

describe('mapVisual', () => {
  it('maps endpoints to the ramp endpoints (continuous)', () => {
    expect(mapVisual(0, cont).color).toBe(sequentialRamp(0))
    expect(mapVisual(100, cont).color).toBe(sequentialRamp(1))
  })

  it('clamps out-of-range values', () => {
    expect(mapVisual(-50, cont).color).toBe(sequentialRamp(0))
    expect(mapVisual(200, cont).color).toBe(sequentialRamp(1))
  })

  it('resolves a size on the size channel', () => {
    const o: VisualMapOptions = { min: 0, max: 10, channel: 'size', sizeRange: [2, 12] }
    expect(mapVisual(0, o).size).toBe(2)
    expect(mapVisual(10, o).size).toBe(12)
    expect(mapVisual(5, o).size).toBe(7)
  })

  it('picks the right bucket (piecewise)', () => {
    const o: VisualMapOptions = { min: 0, max: 100, mode: 'piecewise', pieces: 5 }
    expect(pieceIndex(0, o)).toBe(0)
    expect(pieceIndex(50, o)).toBe(2)
    expect(pieceIndex(100, o)).toBe(4)
  })
})

describe('visualVisible', () => {
  it('filters by the continuous range', () => {
    expect(visualVisible(50, cont, [20, 80], null)).toBe(true)
    expect(visualVisible(10, cont, [20, 80], null)).toBe(false)
  })

  it('filters by hidden piecewise buckets', () => {
    const o: VisualMapOptions = { min: 0, max: 100, mode: 'piecewise', pieces: 5 }
    expect(visualVisible(50, o, null, new Set([2]))).toBe(false)
    expect(visualVisible(50, o, null, new Set([0]))).toBe(true)
  })
})

describe('VisualMap legend', () => {
  it('renders two thumbs and a labelled group (continuous)', () => {
    const range = signal<[number, number]>([0, 100])
    const { container } = render(<VisualMap options={cont} range={range} label="Heat" />)
    expect(container.querySelectorAll('[data-visual-thumb]').length).toBe(2)
    expect(container.querySelector('[role="group"]')!.getAttribute('aria-label')).toContain('Heat')
  })

  it('narrows the range when the low thumb is arrowed', () => {
    const range = signal<[number, number]>([0, 100])
    const { container } = render(<VisualMap options={cont} range={range} />)
    const low = container.querySelector('[data-visual-thumb="low"]')!
    fireEvent.keyDown(low, { key: 'ArrowRight' })
    expect(range.value[0]).toBeGreaterThan(0)
  })

  it('toggles a bucket when a swatch is clicked (piecewise)', () => {
    const o: VisualMapOptions = { min: 0, max: 100, mode: 'piecewise', pieces: 4 }
    const hidden = signal(new Set<number>())
    const { getAllByRole } = render(<VisualMap options={o} hidden={hidden} />)
    const swatches = getAllByRole('button')
    expect(swatches).toHaveLength(4)
    fireEvent.click(swatches[1]!)
    expect(hidden.value.has(1)).toBe(true)
  })
})
