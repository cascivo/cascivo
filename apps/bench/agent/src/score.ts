/**
 * Score what a run left behind: does the app type-check, and what does `cascivo audit --ai`
 * find in it. Both are what an adopter would run next.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

export interface Score {
  /** The app's directory, relative to the run's, or null when the run produced no app. */
  app: string | null
  /** `error TS…` lines from `tsc --noEmit`; null when there was no app to check. */
  tscErrors: number | null
  auditErrors: number | null
  auditWarnings: number | null
}

/** The scaffolded app: the directory holding the `package.json` `cascivo create` wrote. */
export function findApp(dir: string): string | null {
  if (existsSync(join(dir, 'package.json')) && existsSync(join(dir, 'src'))) return '.'
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory() && existsSync(join(full, 'package.json'))) return entry
  }
  return null
}

export function countTscErrors(output: string): number {
  return output.split('\n').filter((line) => /\berror TS\d+:/.test(line)).length
}

/** Errors and warnings in `cascivo audit --ai --json` output. */
export function countAudit(output: string): { errors: number; warnings: number } {
  const raw: unknown = JSON.parse(output || '[]')
  if (!Array.isArray(raw)) throw new Error('cascivo audit --json did not print an array')
  let errors = 0
  let warnings = 0
  for (const finding of raw) {
    const level = typeof finding === 'object' && finding !== null ? finding.level : undefined
    if (level === 'error') errors += 1
    else if (level === 'warn') warnings += 1
  }
  return { errors, warnings }
}

/**
 * @param nodeModules An installed dependency tree to link into the app, so it type-checks
 *   against this build without an install per run.
 * @param cli This repo's built CLI (`packages/cli/bin/cascivo.mjs`).
 */
export function score(runDir: string, nodeModules: string, cli: string): Score {
  const app = findApp(runDir)
  if (app === null) return { app, tscErrors: null, auditErrors: null, auditWarnings: null }
  const appDir = join(runDir, app)
  if (!existsSync(join(appDir, 'node_modules'))) {
    spawnSync('ln', ['-s', nodeModules, join(appDir, 'node_modules')])
  }
  const tsc = spawnSync('npx', ['tsc', '--noEmit', '-p', '.'], { cwd: appDir, encoding: 'utf8' })
  const audit = spawnSync('node', [cli, 'audit', '--ai', '--json', '--level', 'warn', 'src'], {
    cwd: appDir,
    encoding: 'utf8',
  })
  const { errors, warnings } = countAudit(audit.stdout)
  return {
    app,
    tscErrors: countTscErrors(`${tsc.stdout}${tsc.stderr}`),
    auditErrors: errors,
    auditWarnings: warnings,
  }
}
