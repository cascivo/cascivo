import { createMockApi } from '@cascivo/example-kit'

export const api = createMockApi(42)
export const pipelines = api.getPipelines()
export const environments = api.getEnvironments()
export const metrics = api.getMetrics()
