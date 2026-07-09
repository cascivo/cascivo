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
export async function runDoctorDrift(
  config: CascadeConfig,
  cwd: string = process.cwd(),
): Promise<void> {
  const lock = await readLock(cwd)
  if (!lock || Object.keys(lock.items).length === 0) {
    console.log('No installed components found in cascivo.lock.')
    return
  }

  const registry = await fetchRegistry(config.registry)
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
}
