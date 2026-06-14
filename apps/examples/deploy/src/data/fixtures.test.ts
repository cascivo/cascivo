import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.mock() calls are hoisted to the top of the file by Vitest,
// so these run before the module under test is imported.
vi.mock('@cascivo/core', () => ({
  signal: (initial: unknown) => {
    let _value = initial
    return {
      get value() {
        return _value
      },
      set value(v: unknown) {
        _value = v
      },
    }
  },
}))

vi.mock('@cascivo/example-kit', () => ({
  createMockApi: () => ({
    getPipelines: vi.fn().mockResolvedValue([]),
    getEnvironments: vi.fn().mockResolvedValue([]),
    getMetrics: vi.fn().mockResolvedValue(null),
    wrap: (fn: () => unknown) => async () => fn(),
  }),
}))

// Import after mocks are registered
const { loadData, loading, loadError } = await import('./fixtures')

describe('loadData', () => {
  beforeEach(() => {
    loading.value = false
    loadError.value = null
  })

  it('sets loading=false and clears loadError on success', async () => {
    await loadData()
    expect(loading.value).toBe(false)
    expect(loadError.value).toBeNull()
  })

  it('sets loadError and loading=false on rejection', async () => {
    const { api } = await import('./fixtures')
    vi.spyOn(api, 'wrap').mockImplementation(() => async () => {
      throw new Error('network failure')
    })

    await loadData()

    expect(loadError.value).toBe('network failure')
    expect(loading.value).toBe(false)
  })
})
