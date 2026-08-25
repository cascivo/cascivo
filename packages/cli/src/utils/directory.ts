import type { RegistryNamespaceConfig } from './config.js'
import { fetchJson } from './http.js'
import type { FetchFn } from './http.js'

import { CASCIVO_HOST } from './config.js'

export const DIRECTORY_URL = `${CASCIVO_HOST}/r/registries.json`

/**
 * Pull the registry URL for one namespace out of a directory payload, or null.
 *
 * The result is used as a fetch base for component installs, so an entry whose
 * `registryUrl` is not a string — or not http(s) — is dropped rather than
 * trusted: `resolveItemUrl` would otherwise build request URLs by concatenating
 * onto whatever came back.
 */
function pickRegistryUrl(raw: unknown, ns: string): string | null {
  if (typeof raw !== 'object' || raw === null) return null
  const registries = (raw as { registries?: unknown }).registries
  if (!Array.isArray(registries)) return null
  for (const entry of registries) {
    if (typeof entry !== 'object' || entry === null) continue
    const e = entry as Record<string, unknown>
    if (e['namespace'] !== ns) continue
    const url = e['registryUrl']
    if (typeof url !== 'string' || !/^https?:\/\//.test(url)) return null
    return url
  }
  return null
}

export async function resolveFromDirectory(
  ns: string,
  fetchFn?: FetchFn,
): Promise<RegistryNamespaceConfig | null> {
  try {
    // fetchJson uses the module-level _fetchFn; if a custom fetchFn is provided, we use it directly
    let data: unknown
    if (fetchFn) {
      const res = await fetchFn(DIRECTORY_URL, { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      data = await res.json()
    } else {
      data = await fetchJson(DIRECTORY_URL)
    }
    return pickRegistryUrl(data, ns)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn(`Could not reach cascivo.com directory: ${msg}`)
    return null
  }
}
