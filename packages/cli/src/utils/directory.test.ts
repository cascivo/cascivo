import { describe, it, expect, vi, afterEach } from 'vitest'
import { resolveFromDirectory, DIRECTORY_URL } from './directory.js'

const mockDirectory = {
  schemaVersion: 1,
  registries: [
    {
      namespace: '@myns',
      name: 'My Namespace',
      registryUrl: 'https://myns.example.com/r/{name}.json',
    },
    {
      namespace: '@other',
      name: 'Other',
      registryUrl: 'https://other.example.com/r/{name}.json',
    },
  ],
}

function makeFetch(data: unknown, ok = true): (url: string) => Promise<Response> {
  return async (_url: string) =>
    ({
      ok,
      status: ok ? 200 : 500,
      json: async () => data,
    }) as Response
}

describe('resolveFromDirectory', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves a known namespace', async () => {
    const result = await resolveFromDirectory('@myns', makeFetch(mockDirectory))
    expect(result).toBe('https://myns.example.com/r/{name}.json')
  })

  it('returns null for an unknown namespace', async () => {
    const result = await resolveFromDirectory('@unknown', makeFetch(mockDirectory))
    expect(result).toBeNull()
  })

  it('returns null and warns on network failure', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const failingFetch = async (_url: string): Promise<Response> => {
      throw new Error('ECONNREFUSED')
    }
    const result = await resolveFromDirectory('@myns', failingFetch)
    expect(result).toBeNull()
    expect(warnSpy).toHaveBeenCalledOnce()
    expect(warnSpy.mock.calls[0]![0]).toMatch(/Could not reach cascade-ui\.dev directory/)
    expect(warnSpy.mock.calls[0]![0]).toMatch(/ECONNREFUSED/)
  })

  it('returns null and warns on non-ok HTTP response', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await resolveFromDirectory('@myns', makeFetch(null, false))
    expect(result).toBeNull()
    expect(warnSpy).toHaveBeenCalledOnce()
  })

  it('exports DIRECTORY_URL', () => {
    expect(DIRECTORY_URL).toBe('https://cascade-ui.dev/r/registries.json')
  })
})
