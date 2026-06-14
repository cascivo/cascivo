import { describe, it, expect } from 'vitest'
import { pipelines, environments, metrics } from '../src/data/fixtures'

describe('fixtures', () => {
  it('returns pipelines', () => {
    expect(pipelines.length).toBeGreaterThan(0)
  })

  it('returns environments', () => {
    expect(environments.length).toBeGreaterThan(0)
  })

  it('returns metrics', () => {
    expect(metrics.deployFrequency).toBeGreaterThan(0)
  })
})
