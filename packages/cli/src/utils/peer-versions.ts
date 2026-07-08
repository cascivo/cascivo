import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { satisfiesFloor } from './semver.js'

/** Reads the installed version of a package from the project's node_modules, or null if absent/unreadable. */
export async function readInstalledPackageVersion(
  cwd: string,
  pkgName: string,
): Promise<string | null> {
  try {
    const pkg = JSON.parse(
      await readFile(join(cwd, 'node_modules', pkgName, 'package.json'), 'utf8'),
    ) as { version?: string }
    return typeof pkg.version === 'string' ? pkg.version : null
  } catch {
    return null
  }
}

export interface PeerVersionViolation {
  pkg: string
  required: string
  installed: string | null
}

/**
 * Checks installed peer package versions against the floors a registry entry
 * declares (`peerVersions`, e.g. `{ "@cascivo/i18n": ">=0.2.1" }`). Returns
 * only the packages that fail — either missing or older than required.
 */
export async function checkPeerVersions(
  cwd: string,
  floors: Record<string, string>,
): Promise<PeerVersionViolation[]> {
  const violations: PeerVersionViolation[] = []
  for (const [pkg, required] of Object.entries(floors)) {
    const installed = await readInstalledPackageVersion(cwd, pkg)
    if (installed === null || !satisfiesFloor(installed, required)) {
      violations.push({ pkg, required, installed })
    }
  }
  return violations
}
