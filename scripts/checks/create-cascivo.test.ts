/**
 * `npm create cascivo` is `cascivo create`, byte for byte.
 *
 * `create-cascivo` is a launcher with no logic of its own, which is the point: two entry
 * points that each built a scaffold would drift, and the one people type first
 * (`npm create …`) is the one nobody would notice going stale. This runs both into temp
 * directories and requires identical output, for the default and the Cloudflare shape.
 *
 * Requires a prior `vp run cascivo#build` (the launcher imports the built CLI).
 *
 * Run: `pnpm scaffold:check` (and in `pnpm ready`).
 */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { after, describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const CLI = join(REPO_ROOT, 'packages/cli/dist/index.mjs')
const LAUNCHER = join(REPO_ROOT, 'packages/create-cascivo/bin/create-cascivo.mjs')

const workdir = mkdtempSync(join(tmpdir(), 'create-cascivo-'))
after(() => rmSync(workdir, { recursive: true, force: true }))

function files(dir: string): Map<string, string> {
  const out = new Map<string, string>()
  const walk = (d: string) => {
    for (const item of readdirSync(d)) {
      const full = join(d, item)
      if (statSync(full).isDirectory()) walk(full)
      else out.set(relative(dir, full), readFileSync(full, 'utf8'))
    }
  }
  walk(dir)
  return out
}

function scaffold(entry: string, args: string[], into: string): Map<string, string> {
  const cwd = join(workdir, into)
  mkdirSync(cwd)
  const argv = entry === CLI ? [CLI, 'create', ...args] : [LAUNCHER, ...args]
  execFileSync(process.execPath, argv, { cwd, stdio: 'pipe' })
  return files(join(cwd, args[0]!))
}

describe('create-cascivo — `npm create cascivo` matches `cascivo create`', () => {
  for (const [label, args] of [
    ['default', ['demo-app', '--yes', '--pm', 'npm']],
    ['cloudflare', ['demo-app', '--yes', '--pm', 'pnpm', '--framework', 'cloudflare']],
  ] as const) {
    it(`${label}: same files, same contents`, () => {
      const viaCli = scaffold(CLI, [...args], `cli-${label}`)
      const viaLauncher = scaffold(LAUNCHER, [...args], `launcher-${label}`)
      assert.ok(viaCli.size > 5, `cascivo create wrote only ${viaCli.size} files`)
      assert.deepEqual([...viaLauncher.keys()].sort(), [...viaCli.keys()].sort())
      for (const [path, contents] of viaCli) assert.equal(viaLauncher.get(path), contents, path)
    })
  }
})
