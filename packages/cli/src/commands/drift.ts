import type { CascadeConfig } from '../utils/config.js'
import { readFileSafe } from '../utils/fs.js'
import { readLock, sha256 } from '../utils/lock.js'
import { checkPeerVersions } from '../utils/peer-versions.js'
import { fetchRegistry, findComponent } from '../utils/registry.js'

/**
 * `cascivo doctor --drift` — compares installed components against the
 * registry. Two drift classes:
 *
 *  1. Local-edit drift: an installed file's content no longer matches what
 *     was copied at install time (hand edits, or deleted after install).
 *  2. Peer-version drift: the currently-registered component source needs a
 *     newer `@cascivo/*` peer package (per `peerVersions`) than what's
 *     actually installed in node_modules — the dashboard-feedback failure
 *     mode (DataTable referencing an i18n builtin key an older published
 *     @cascivo/i18n build doesn't have).
 */
/**
 * What a drift run actually managed to do.
 *
 * `runDoctorDrift` used to return void, so the default `cascivo doctor` could not run it and
 * still say something honest. That is how "No violations found." got printed by a run that
 * had never looked: the two were disjoint branches, and `--drift` reported five real issues
 * on the same project.
 */
export interface DriftOutcome {
  /** False when the check could not run at all (no lockfile, offline, unreachable registry). */
  ran: boolean
  /** Why it could not run — printed instead of an unqualified "clean". */
  reason?: string
  issues: number
}

export async function runDoctorDrift(
  config: CascadeConfig,
  cwd: string = process.cwd(),
): Promise<DriftOutcome> {
  const lock = await readLock(cwd)
  if (!lock || Object.keys(lock.items).length === 0) {
    console.log('No installed components found in cascivo.lock.')
    return {
      ran: false,
      reason: 'no components installed (cascivo.lock is empty or missing)',
      issues: 0,
    }
  }

  let registry: Awaited<ReturnType<typeof fetchRegistry>>
  try {
    registry = await fetchRegistry(config.registry)
  } catch (error) {
    const reason = `could not reach the registry (${error instanceof Error ? error.message : String(error)})`
    console.log(`Drift check skipped: ${reason}`)
    return { ran: false, reason, issues: 0 }
  }
  let driftCount = 0

  for (const [name, entry] of Object.entries(lock.items)) {
    const current = findComponent(registry, name)
    if (!current) continue

    for (const [path, lockedHash] of Object.entries(entry.files)) {
      const content = await readFileSafe(path)
      if (content === null) {
        console.log(`${name}: ${path} is missing (installed, then deleted)`)
        driftCount++
        continue
      }
      if (sha256(content) !== lockedHash) {
        console.log(`${name}: ${path} has local edits (differs from the version installed)`)
        driftCount++
      }
    }

    if (current.peerVersions) {
      const violations = await checkPeerVersions(cwd, current.peerVersions)
      for (const v of violations) {
        const installedDesc = v.installed ? `${v.installed} is installed` : 'it is not installed'
        console.log(`${name}: needs ${v.pkg} ${v.required}, but ${installedDesc}.`)
        driftCount++
      }
    }
  }

  if (driftCount > 0) {
    console.log(`\n${driftCount} drift issue(s) found.`)
    process.exitCode = 1
  } else {
    console.log('No drift detected — installed components match the registry.')
  }
  return { ran: true, issues: driftCount }
}
