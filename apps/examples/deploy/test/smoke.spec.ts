import { describe, it, expect, beforeAll } from 'vitest'
import { pipelines, environments, metrics, loadData } from '../src/data/fixtures'

describe('fixtures', () => {
  beforeAll(async () => {
    await loadData()
  })

  it('returns pipelines', () => {
    expect(pipelines.value.length).toBeGreaterThan(0)
  })

  it('returns environments', () => {
    expect(environments.value.length).toBeGreaterThan(0)
  })

  it('returns metrics', () => {
    expect(metrics.value?.deployFrequency).toBeGreaterThan(0)
  })
})
