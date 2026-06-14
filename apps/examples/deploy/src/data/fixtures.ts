import { signal } from '@cascivo/core'
import { createMockApi } from '@cascivo/example-kit'
import type { Pipeline, Environment, Metrics } from '@cascivo/example-kit'

export const api = createMockApi(42, { latencyMs: [400, 800], errorRate: 0 })

// Reactive state — sections subscribe to these
export const loading = signal(true)
export const pipelines = signal<Pipeline[]>([])
export const environments = signal<Environment[]>([])
export const metrics = signal<Metrics | null>(null)

// Load all data via the mock API's async wrap — call once at app startup
export async function loadData(): Promise<void> {
  loading.value = true
  const [p, e, m] = await Promise.all([
    api.wrap(() => api.getPipelines())(),
    api.wrap(() => api.getEnvironments())(),
    api.wrap(() => api.getMetrics())(),
  ])
  pipelines.value = p
  environments.value = e
  metrics.value = m
  loading.value = false
}
