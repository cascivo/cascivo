/**
 * Mechanism G — is a "closed" finding actually reachable by `pnpm add`?
 *
 * ## Why this is a separate script from `recurrence:check`
 *
 * It talks to the npm registry. `pnpm ready` is offline and stays offline, so this runs in
 * the daily `docs-freshness` workflow and before a release, alongside `deployed-freshness.sh`
 * and `npm:parity` — the other checks that compare this checkout against the world.
 *
 * ## What it asserts
 *
 * 1. Every `shippedIn` version is really published. A row claiming a version that does not
 *    exist on npm is worse than no row.
 * 2. Nothing has been sitting in "closed — awaiting release" for long enough to reach an
 *    adopter. This is the actual defect: on 2026-08-08 two adopters, on two different
 *    frameworks, re-reported four findings this ledger listed as closed. The fixes had been
 *    merged for two days and published for none of them — `0.16.1` landed 2026-08-10, two
 *    days AFTER both reports were written against the newest version that existed.
 *
 * The second assertion is the one with teeth, and it is deliberately a *count*, not a
 * timestamp: the ledger has no dates, and adding them would make this guard depend on
 * bookkeeping nobody maintains. A backlog of unshipped fixes IS the signal.
 *
 * ## This is a RELEASE gate, and it is expected to be red between merge and publish
 *
 * Landing a plan's fixes moves rows into "closed — awaiting release", so this goes red. That
 * is the design: the red is the backlog becoming visible instead of invisible. It returns to
 * green when the release PR publishes and sets each row's `shippedIn` — which is the step
 * that was silently skipped for four days across two adopter runs.
 *
 * It is deliberately NOT part of `pnpm ready`: it needs the network, and a per-PR gate that
 * a contributor cannot clear on their own is a gate they learn to ignore.
 */
import { readFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

const run = promisify(execFile)
const HERE = dirname(fileURLToPath(import.meta.url))
const DIR = join(HERE, '..', '..', 'docs', 'internal', 'feedback')

interface Finding {
  id: string
  title: string
  status: 'open' | 'closed'
  shippedIn?: string | null
}

const data = JSON.parse(await readFile(join(DIR, 'recurrence.json'), 'utf8')) as {
  findings: Finding[]
}

/** Versions published for a package, or null when the registry is unreachable. */
async function publishedVersions(pkg: string): Promise<string[] | null> {
  try {
    const { stdout } = await run('npm', ['view', pkg, 'versions', '--json'], { timeout: 60_000 })
    const parsed: unknown = JSON.parse(stdout)
    return Array.isArray(parsed) ? (parsed as string[]) : [String(parsed)]
  } catch {
    return null
  }
}

/**
 * How many unshipped closed findings are tolerable before this fails.
 *
 * Not zero: there is always a window between merging a fix and cutting a release, and a
 * guard that fails during every normal PR is a guard people switch off. Six is roughly one
 * plan's worth of workstreams — beyond that, a whole report's fixes are sitting where no
 * adopter can reach them, which is precisely the 2026-08-08 situation.
 */
const AWAITING_RELEASE_BUDGET = 6

describe('recurrence — closed findings are reachable by `pnpm add`', () => {
  const closed = data.findings.filter((f) => f.status === 'closed')

  it('every declared shippedIn version is really on npm', async () => {
    const claims = new Map<string, string[]>()
    for (const f of closed) {
      if (!f.shippedIn) continue
      const at = f.shippedIn.lastIndexOf('@')
      const pkg = f.shippedIn.slice(0, at)
      const version = f.shippedIn.slice(at + 1)
      if (!claims.has(pkg)) claims.set(pkg, [])
      claims.get(pkg)!.push(version)
    }

    const bogus: string[] = []
    for (const [pkg, versions] of claims) {
      const published = await publishedVersions(pkg)
      if (published === null) {
        console.log(`recurrence-shipped: skipped ${pkg} — registry unreachable`)
        continue
      }
      for (const v of new Set(versions)) {
        if (!published.includes(v)) bogus.push(`${pkg}@${v}`)
      }
    }
    assert.deepEqual(
      bogus,
      [],
      `The ledger claims these versions shipped, but npm has never published them: ${bogus.join(', ')}`,
    )
  })

  it('the awaiting-release backlog is not adopter-visible', () => {
    const awaiting = closed.filter((f) => !f.shippedIn)
    assert.ok(
      awaiting.length <= AWAITING_RELEASE_BUDGET,
      `${awaiting.length} findings are fixed on main and unpublished, over the budget of ` +
        `${AWAITING_RELEASE_BUDGET}. Every adopter who tests today still meets all of them, ` +
        `and re-reports them — which is exactly what happened on 2026-08-08. Cut a release ` +
        `and set shippedIn, per docs/RELEASING.md:\n  ` +
        awaiting.map((f) => `${f.id} — ${f.title}`).join('\n  '),
    )
  })
})
