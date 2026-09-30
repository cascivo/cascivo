/**
 * The publishable `packages/*` workspaces and which of them npm has never seen.
 * Shared by the release preflight (`scripts/checks/npm-bootstrap.mjs`) and the
 * first-publish bootstrap (`scripts/release/bootstrap.mjs`), so the name the
 * preflight reports missing is exactly the name the bootstrap publishes.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

export const REPO_ROOT = join(import.meta.dirname, '../..')
export const REGISTRY = 'https://registry.npmjs.org'

/**
 * @typedef {{ name: string, version: string, dir: string, dependencies: Record<string, string> }} Publishable
 */

/** @returns {Publishable[]} every non-private `packages/*` workspace */
export function listPublishable() {
  /** @type {Publishable[]} */
  const published = []
  for (const entry of readdirSync(join(REPO_ROOT, 'packages'))) {
    let raw
    try {
      raw = readFileSync(join(REPO_ROOT, 'packages', entry, 'package.json'), 'utf8')
    } catch {
      continue
    }
    const pkg = JSON.parse(raw)
    if (pkg.private === true) continue
    published.push({
      name: pkg.name,
      version: pkg.version,
      dir: entry,
      dependencies: pkg.dependencies ?? {},
    })
  }
  return published
}

/**
 * The versions npm has for `name`: `null` when npm has never seen the name,
 * `undefined` when the registry neither confirmed nor denied it.
 *
 * @param {string} name
 * @returns {Promise<{ versions: string[] | null | undefined, note?: string }>}
 */
export async function fetchVersions(name) {
  try {
    const res = await fetch(`${REGISTRY}/${encodeURIComponent(name)}`, {
      headers: { accept: 'application/vnd.npm.install-v1+json' },
    })
    if (res.status === 404) return { versions: null }
    if (!res.ok) return { versions: undefined, note: `HTTP ${res.status}` }
    /** @type {unknown} */
    const body = await res.json()
    const versions =
      typeof body === 'object' && body !== null && 'versions' in body ? body.versions : undefined
    if (typeof versions !== 'object' || versions === null) {
      return { versions: undefined, note: 'registry response has no versions map' }
    }
    return { versions: Object.keys(versions) }
  } catch (error) {
    return { versions: undefined, note: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * Splits the publishable packages into those npm has never seen (`missing`) and
 * those the registry could not answer for (`unknown`, which prove nothing).
 *
 * @param {Publishable[]} published
 */
export async function findMissing(published) {
  /** @type {Publishable[]} */
  const missing = []
  /** @type {string[]} */
  const unknown = []
  await Promise.all(
    published.map(async (pkg) => {
      const { versions, note } = await fetchVersions(pkg.name)
      if (versions === null) missing.push(pkg)
      else if (versions === undefined) unknown.push(`${pkg.name} (${note})`)
    }),
  )
  missing.sort((a, b) => a.name.localeCompare(b.name))
  unknown.sort()
  return { missing, unknown }
}
