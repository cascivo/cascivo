/**
 * The `generatedAt` stamp shared by every artifact `pnpm regen` writes.
 *
 * `regen` must be reproducible: CI regenerates on every PR (the `drift` job)
 * and again at release time, and fails if the result differs from what is
 * committed. A wall-clock stamp makes that impossible — artifacts committed on
 * one UTC day and regenerated on the next differ by the date alone, so the
 * release gate failed on every release that did not happen on the same day as
 * the last regen commit, and the only fix was a no-op "re-stamp the dates"
 * commit. (Same reasoning as the sitemap generator's deterministic `lastmod`.)
 *
 * The stamp is therefore keyed to the registry *version* rather than the clock:
 * it records the day the current version's artifacts were first generated and
 * only moves when the version does. A version bump always regenerates
 * (`version-packages` runs `changeset version && … && pnpm regen`), so the new
 * stamp lands in the same commit as the bump.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const REGISTRY_PATH = join(import.meta.dirname, '..', '..', 'registry.json')

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function readRegistry(path: string): { version?: unknown; generatedAt?: unknown } {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return {}
  }
}

/**
 * The stamp for a registry being written at `version`: the committed stamp if
 * the version is unchanged, otherwise today. Used by the registry generator,
 * which is the only writer of the value.
 */
export function stampForVersion(version: string, registryPath: string = REGISTRY_PATH): string {
  const prev = readRegistry(registryPath)
  if (prev.version === version && typeof prev.generatedAt === 'string') return prev.generatedAt
  return today()
}

/**
 * The stamp the current `registry.json` carries. Every other generator reads it
 * (registry generation runs first in the `regen` chain) so one regen produces
 * one date across all artifacts.
 */
export function registryGeneratedAt(registryPath: string = REGISTRY_PATH): string {
  const { generatedAt } = readRegistry(registryPath)
  return typeof generatedAt === 'string' && generatedAt !== '' ? generatedAt : today()
}
