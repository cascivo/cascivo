import { createMockApi } from '@cascivo/example-kit'
import {
  INCIDENTS,
  INSTANCES,
  USER_TASKS,
  type Incident,
  type ProcessInstance,
  type UserTask,
} from '../data/fixtures'

export type { ProcessInstance, Incident, UserTask }
export type { InstanceStatus } from '../data/fixtures'

// Mutable in-memory copies so mutations are reflected in subsequent calls
const instances = INSTANCES.map((inst) => ({ ...inst }))
const tasks = USER_TASKS.map((t) => ({ ...t }))

const mockApi = createMockApi(13)

export const api = {
  listInstances(filter?: string): Promise<ProcessInstance[]> {
    return mockApi.wrap(() => {
      if (!filter || filter === 'all') return instances
      return instances.filter((i) => i.status === filter)
    })()
  },

  getInstance(id: string): Promise<ProcessInstance | undefined> {
    return mockApi.wrap(() => instances.find((i) => i.id === id))()
  },

  listIncidents(instanceId?: string): Promise<Incident[]> {
    return mockApi.wrap(() => {
      if (!instanceId) return INCIDENTS
      return INCIDENTS.filter((inc) => inc.instanceId === instanceId)
    })()
  },

  listTasks(): Promise<UserTask[]> {
    return mockApi.wrap(() => [...tasks])()
  },

  claimTask(id: string): Promise<UserTask> {
    return mockApi.wrap(() => {
      const idx = tasks.findIndex((t) => t.id === id)
      if (idx === -1) throw new Error(`Task ${id} not found`)
      const updated = { ...tasks[idx]!, assignee: 'current.user' }
      tasks[idx] = updated
      return updated
    })()
  },

  completeTask(id: string, vars: Record<string, unknown>): Promise<UserTask> {
    return mockApi.wrap(() => {
      const idx = tasks.findIndex((t) => t.id === id)
      if (idx === -1) throw new Error(`Task ${id} not found`)
      const task = { ...tasks[idx]!, ...vars }
      tasks.splice(idx, 1)
      return task
    })()
  },
}
