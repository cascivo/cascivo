/**
 * Regen determinism check.
 *
 * `pnpm regen` must produce byte-identical output for a given checkout: CI
 * regenerates on every PR (the `drift` job) and again at release time
 * (release.yml "Verify generated docs are up to date") and fails on any diff.
 * A wall-clock read inside a generator breaks that — artifacts committed on one
 * UTC day and regenerated on the next differ by the date alone, which is what
 * failed the release run on 2026-07-26 (and what the no-op "re-stamp" commits
 * before it were papering over).
 *
 * Two guards:
 *   1. No generator reachable from the `regen` script reads the clock
 *      (`new Date()` with no argument, or `Date.now()`). The one sanctioned
 *      stamp lives in scripts/registry/generated-at.ts and is keyed to the
 *      registry version.
 *   2. That stamp is sticky: unchanged version → unchanged date.
 */

import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { describe, it } from 'node:test'
import { registryGeneratedAt, stampForVersion } from '../registry/generated-at.ts'

const REPO_ROOT = join(import.meta.dirname, '..', '..')
const SCRIPTS_ROOT = join(REPO_ROOT, 'scripts')

/** The module that owns the stamp — the one place allowed to read the clock. */
const STAMP_MODULE = join(SCRIPTS_ROOT, 'registry', 'generated-at.ts')

const CLOCK_READ = /\bnew Date\(\s*\)|\bDate\.now\(\s*\)/

/** Entry files of every script the `regen` chain runs, in chain order. */
function regenEntryFiles(): string[] {
  const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as {
    scripts: Record<string, string>
  }
  const entries: string[] = []
  for (const step of pkg.scripts['regen']!.split('&&')) {
    const name = step.trim().replace(/^pnpm\s+/, '')
    const command = pkg.scripts[name]
    assert.ok(command, `regen step \`${name}\` is not a package.json script`)
    const file = command.match(/\S+\.(?:ts|mjs)\b/)?.[0]
    if (file) entries.push(join(REPO_ROOT, file))
  }
  return entries
}

/** Entry files plus every module under scripts/ they import, transitively. */
function reachableModules(entries: string[]): string[] {
  const seen = new Set<string>()
  const queue = [...entries]
  while (queue.length > 0) {
    const file = queue.pop()!
    if (seen.has(file)) continue
    seen.add(file)
    const source = readFileSync(file, 'utf8')
    // Line-anchored so example code inside generated-docs template literals
    // isn't mistaken for an import of this repo.
    for (const [, specifier] of source.matchAll(/^\s*(?:im|ex)port[^\n]*?from '(\.[^']+)'/gm)) {
      const target = resolve(dirname(file), specifier)
      if (target.startsWith(SCRIPTS_ROOT) && existsSync(target)) queue.push(target)
    }
  }
  return [...seen]
}

describe('regen determinism', () => {
  it('no generator in the regen chain reads the clock', () => {
    const offenders = reachableModules(regenEntryFiles())
      .filter((file) => file !== STAMP_MODULE)
      .filter((file) => CLOCK_READ.test(readFileSync(file, 'utf8')))
      .map((file) => relative(REPO_ROOT, file))
      .sort()

    assert.deepEqual(
      offenders,
      [],
      `Wall-clock read in a regen generator — regen output must depend only on the checkout.\n` +
        `Use registryGeneratedAt() from scripts/registry/generated-at.ts instead:\n` +
        offenders.map((f) => `  - ${f}`).join('\n'),
    )
  })

  it('keeps the committed stamp while the registry version is unchanged', () => {
    const path = join(mkdtempSync(join(tmpdir(), 'cascivo-stamp-')), 'registry.json')
    writeFileSync(path, JSON.stringify({ version: '1.2.3', generatedAt: '2020-01-01' }))

    assert.equal(stampForVersion('1.2.3', path), '2020-01-01')
    assert.equal(registryGeneratedAt(path), '2020-01-01')
  })

  it('restamps when the registry version changes', () => {
    const path = join(mkdtempSync(join(tmpdir(), 'cascivo-stamp-')), 'registry.json')
    writeFileSync(path, JSON.stringify({ version: '1.2.3', generatedAt: '2020-01-01' }))

    assert.match(stampForVersion('1.2.4', path), /^\d{4}-\d{2}-\d{2}$/)
    assert.notEqual(stampForVersion('1.2.4', path), '2020-01-01')
  })

  it('falls back to a date when no registry exists yet', () => {
    const missing = join(mkdtempSync(join(tmpdir(), 'cascivo-stamp-')), 'registry.json')

    assert.match(stampForVersion('1.0.0', missing), /^\d{4}-\d{2}-\d{2}$/)
    assert.match(registryGeneratedAt(missing), /^\d{4}-\d{2}-\d{2}$/)
  })
})
