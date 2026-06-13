import type { RegistryNamespaceConfig } from './config.js'
import { fetchJson } from './http.js'
import type { FetchFn } from './http.js'

export const DIRECTORY_URL = 'https://cascade-ui.dev/r/registries.json'

interface DirectoryEntry {
  namespace: string
  registryUrl: string
}

interface DirectoryResponse {
  registries?: DirectoryEntry[]
}

export async function resolveFromDirectory(
  ns: string,
  fetchFn?: FetchFn,
): Promise<RegistryNamespaceConfig | null> {
  try {
    // fetchJson uses the module-level _fetchFn; if a custom fetchFn is provided, we use it directly
    let data: DirectoryResponse
    if (fetchFn) {
      const res = await fetchFn(DIRECTORY_URL, { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      data = (await res.json()) as DirectoryResponse
    } else {
      data = (await fetchJson(DIRECTORY_URL)) as DirectoryResponse
    }
    const entry = data.registries?.find((r) => r.namespace === ns)
    if (!entry) return null
    return entry.registryUrl
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn(`Could not reach cascade-ui.dev directory: ${msg}`)
    return null
  }
}
