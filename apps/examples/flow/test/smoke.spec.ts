import { describe, it, expect } from 'vitest'
import {
  INSTANCES,
  INCIDENTS,
  USER_TASKS,
  PROCESS_NODES,
  PROCESS_EDGES,
} from '../src/data/fixtures'
import { api } from '../src/api'

describe('fixtures', () => {
  it('generates 10 process instances', () => {
    expect(INSTANCES).toHaveLength(10)
  })

  it('all instances have valid status', () => {
    const valid = new Set(['active', 'completed', 'incident'])
    expect(INSTANCES.every((i) => valid.has(i.status))).toBe(true)
  })

  it('active instances have a currentNodeId', () => {
    const active = INSTANCES.filter((i) => i.status === 'active')
    expect(active.every((i) => i.currentNodeId !== null)).toBe(true)
  })

  it('completed instances have null currentNodeId', () => {
    const completed = INSTANCES.filter((i) => i.status === 'completed')
    expect(completed.every((i) => i.currentNodeId === null)).toBe(true)
  })

  it('generates 3 incidents', () => {
    expect(INCIDENTS).toHaveLength(3)
  })

  it('generates 3 user tasks', () => {
    expect(USER_TASKS).toHaveLength(3)
  })

  it('process has 7 nodes', () => {
    expect(PROCESS_NODES).toHaveLength(7)
  })

  it('process has 7 edges', () => {
    expect(PROCESS_EDGES).toHaveLength(7)
  })

  it('all instances have at least one history entry', () => {
    expect(INSTANCES.every((i) => i.history.length > 0)).toBe(true)
  })

  it('all instances have variables', () => {
    expect(INSTANCES.every((i) => typeof i.variables === 'object')).toBe(true)
  })
})

describe('api', () => {
  it('listInstances returns all instances', async () => {
    const data = await api.listInstances()
    expect(data.length).toBeGreaterThan(0)
  })

  it('listInstances filters by status', async () => {
    const active = await api.listInstances('active')
    expect(active.every((i) => i.status === 'active')).toBe(true)
  })

  it('getInstance returns matching instance', async () => {
    const inst = INSTANCES[0]!
    const result = await api.getInstance(inst.id)
    expect(result?.id).toBe(inst.id)
  })

  it('listIncidents returns all incidents', async () => {
    const data = await api.listIncidents()
    expect(data).toHaveLength(3)
  })

  it('listTasks returns tasks', async () => {
    const data = await api.listTasks()
    expect(data.length).toBeGreaterThan(0)
  })
})
