/**
 * An app's package name must end with its directory name.
 *
 * ## Why
 *
 * An agent building a demo app in a sandboxed monorepo picked a `package.json` `name` that
 * collided with another app's. The result was not a scoped failure: **the task runner refused
 * to run anything at all, for the whole monorepo**, and the cause is invisible from inside the
 * sandbox — project isolation means the agent cannot read sibling apps to discover the clash
 * (2026-08-22 report, repo-level note).
 *
 * The reporter's own fix is the right one: make the convention collision-free *by
 * construction* rather than by coordination. Two apps cannot share a directory, so if the
 * package name is derived from the directory it cannot collide either — and an isolated agent
 * can follow the rule with no knowledge of what else exists.
 *
 * ## Why "ends with" rather than "equals"
 *
 * Every app in this repo already satisfies this (verified across all 20 at the time of
 * writing), under three different prefixes: `@cascivo/site`, `@cascivo/example-pulse`,
 * `bench-runner`. The scope and the `example-`/`bench-` prefixes carry real meaning, so the
 * rule constrains the part that must be unique — the tail — and leaves the prefix alone.
 *
 * The rule was true and unwritten, which is the state in which it silently stops being true.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, basename } from 'node:path'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))

/** Every directory under `apps/` (one or two levels deep) that has a package.json. */
function appDirs(): string[] {
  const out: string[] = []
  const appsRoot = join(ROOT, 'apps')
  for (const entry of readdirSync(appsRoot)) {
    const dir = join(appsRoot, entry)
    if (!statSync(dir).isDirectory()) continue
    if (existsSync(join(dir, 'package.json'))) {
      out.push(dir)
      continue
    }
    for (const nested of readdirSync(dir)) {
      const nestedDir = join(dir, nested)
      if (!statSync(nestedDir).isDirectory()) continue
      if (existsSync(join(nestedDir, 'package.json'))) out.push(nestedDir)
    }
  }
  return out
}

describe('app package names derive from their directory', () => {
  const dirs = appDirs()

  it('finds the apps to check', () => {
    // A restructure that makes the sweep return nothing must fail rather than pass vacuously.
    assert.ok(dirs.length >= 10, `only ${dirs.length} apps found — the discovery predicate broke`)
  })

  it('every app package name ends with its directory name', () => {
    const offenders: string[] = []
    for (const dir of dirs) {
      const name = (
        JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { name?: string }
      ).name
      const expected = basename(dir)
      if (name === undefined) {
        offenders.push(`${expected}: package.json has no \`name\``)
      } else if (!name.endsWith(expected)) {
        offenders.push(`apps/…/${expected}: name is "${name}" — it must end with "${expected}"`)
      }
    }
    assert.deepEqual(
      offenders,
      [],
      'A package name that does not follow its directory can collide with another app, and a ' +
        'duplicate name makes the task runner refuse to run ANY task in the monorepo — a ' +
        'failure an agent working in one app cannot diagnose, because it cannot see the ' +
        'others. Deriving the name from the directory makes collisions impossible.\n  ' +
        offenders.join('\n  '),
    )
  })

  it('no two apps share a package name', () => {
    const seen = new Map<string, string>()
    const dupes: string[] = []
    for (const dir of dirs) {
      const name = (
        JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { name?: string }
      ).name
      if (name === undefined) continue
      const prior = seen.get(name)
      if (prior) dupes.push(`"${name}" is used by both ${prior} and ${basename(dir)}`)
      else seen.set(name, basename(dir))
    }
    assert.deepEqual(dupes, [], `Duplicate app package names:\n  ${dupes.join('\n  ')}`)
  })
})
