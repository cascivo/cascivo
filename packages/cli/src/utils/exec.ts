import { spawnSync } from 'node:child_process'
import { detectPackageManager, installCommand, installHint, type PackageManager } from './config.js'

/**
 * Install npm packages using the detected (or explicitly chosen) package
 * manager, inheriting stdio so the user sees install progress. On failure it
 * prints the exact command to run by hand — the adopter can always recover even
 * when the spawn fails (e.g. npm crashing inside a pnpm workspace). Returns
 * false if the install failed.
 */
export function installPackages(
  packages: string[],
  cwd: string = process.cwd(),
  opts: {
    pm?: PackageManager
    dev?: boolean
    /** Registry peer floors, so a known minimum is honoured rather than silently ignored. */
    floors?: Record<string, string>
    /** `--pin <version>` escape hatch: install every `@cascivo/*` at exactly this version. */
    pin?: string
  } = {},
): boolean {
  if (packages.length === 0) return true
  const pm = opts.pm ?? detectPackageManager(cwd)
  const [cmd, args] = installCommand(pm, packages, {
    dev: opts.dev ?? false,
    ...(opts.floors ? { floors: opts.floors } : {}),
    ...(opts.pin ? { pin: opts.pin } : {}),
  })
  console.log(`Installing ${packages.join(', ')} with ${cmd}…`)
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.status !== 0) {
    console.error(`Failed to install: ${packages.join(', ')}`)
    console.error(
      `Install them yourself with: ${installHint(pm, packages, { dev: opts.dev ?? false })}`,
    )
    return false
  }
  return true
}
