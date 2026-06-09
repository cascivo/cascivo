import { spawnSync } from 'node:child_process'
import { detectPackageManager, installCommand } from './config.js'

/**
 * Install npm packages using the detected package manager, inheriting stdio so
 * the user sees install progress. Returns false if the install failed.
 */
export function installPackages(packages: string[], cwd: string = process.cwd()): boolean {
  if (packages.length === 0) return true
  const [cmd, args] = installCommand(detectPackageManager(cwd), packages)
  console.log(`Installing ${packages.join(', ')} with ${cmd}…`)
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.status !== 0) {
    console.error(`Failed to install: ${packages.join(', ')}`)
    return false
  }
  return true
}
