import { describe, it, expect } from 'vitest'
import { createMockApi } from './mock-api'

describe('createMockApi', () => {
  const api = createMockApi(42)

  it('returns pipelines array', () => {
    const pipelines = api.getPipelines()
    expect(Array.isArray(pipelines)).toBe(true)
    expect(pipelines.length).toBeGreaterThan(0)
  })

  it('pipeline has required shape', () => {
    const [p] = api.getPipelines()
    expect(p).toBeDefined()
    if (!p) return
    expect(typeof p.id).toBe('string')
    expect(typeof p.name).toBe('string')
    expect(typeof p.branch).toBe('string')
    expect(typeof p.commit).toBe('string')
    expect(Array.isArray(p.stages)).toBe(true)
    expect(typeof p.triggeredAt).toBe('string')
    expect(typeof p.status).toBe('string')
  })

  it('stages have required shape', () => {
    const [p] = api.getPipelines()
    const [s] = p?.stages ?? []
    expect(s).toBeDefined()
    if (!s) return
    expect(typeof s.id).toBe('string')
    expect(typeof s.name).toBe('string')
    expect(typeof s.status).toBe('string')
    expect(typeof s.durationMs).toBe('number')
    expect(s.durationMs).toBeGreaterThan(0)
  })

  it('returns environments array', () => {
    const envs = api.getEnvironments()
    expect(Array.isArray(envs)).toBe(true)
    expect(envs.length).toBeGreaterThan(0)
  })

  it('environment has required shape', () => {
    const [e] = api.getEnvironments()
    expect(e).toBeDefined()
    if (!e) return
    expect(typeof e.id).toBe('string')
    expect(typeof e.name).toBe('string')
    expect(['prod', 'staging', 'dev']).toContain(e.tier)
    expect(typeof e.currentVersion).toBe('string')
    expect(typeof e.lastDeployAt).toBe('string')
    expect(['healthy', 'degraded', 'down']).toContain(e.health)
  })

  it('returns metrics with positive values', () => {
    const m = api.getMetrics()
    expect(m.deployFrequency).toBeGreaterThan(0)
    expect(m.leadTime).toBeGreaterThan(0)
    expect(m.changeFailRate).toBeGreaterThanOrEqual(0)
    expect(m.mttr).toBeGreaterThan(0)
  })

  it('is deterministic — same seed, same data', () => {
    const a = createMockApi(7)
    const b = createMockApi(7)
    expect(a.getPipelines()).toEqual(b.getPipelines())
    expect(a.getEnvironments()).toEqual(b.getEnvironments())
    expect(a.getMetrics()).toEqual(b.getMetrics())
  })
})
