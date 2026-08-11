/**
 * Guards the finding-level recurrence ledger.
 *
 * The binding rule — a finding may not be marked closed without naming a guard that exists —
 * is only worth writing down if something checks it. Without this test the ledger degrades
 * into the thing it was built to replace: a list of assertions nobody verified.
 */
import { readFile, readdir, access } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')
const DIR = join(ROOT, 'docs', 'internal', 'feedback')

interface Finding {
  id: string
  title: string
  reports: string[]
  plans: string[]
  mechanism: string
  guard: string | null
  status: 'open' | 'closed'
  shippedIn?: string | null
  note?: string
  guardNote?: string
}

const data = JSON.parse(await readFile(join(DIR, 'recurrence.json'), 'utf8')) as {
  findings: Finding[]
}
const pkg = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>
}

const exists = async (p: string) => {
  try {
    await access(join(ROOT, p))
    return true
  } catch {
    return false
  }
}

test('every closed finding names a guard', () => {
  const unguarded = data.findings
    .filter((f) => f.status === 'closed')
    .filter((f) => !f.guard || f.guard.trim() === '')
    .map((f) => f.id)
  assert.deepEqual(
    unguarded,
    [],
    'A finding closed with no guard is the exact shape that produced twelve repeat reports. ' +
      `Either name the guard, or set status back to "open" with a guardNote: ${unguarded.join(', ')}`,
  )
})

test('every named guard resolves to a real npm script or file', async () => {
  const missing: string[] = []
  for (const f of data.findings) {
    if (!f.guard) continue
    if (pkg.scripts[f.guard]) continue
    if (await exists(f.guard)) continue
    missing.push(`${f.id} → ${f.guard}`)
  }
  assert.deepEqual(
    missing,
    [],
    `these guards are named in the ledger but do not exist: ${missing.join(', ')}`,
  )
})

test('every open finding explains why it has no guard', () => {
  const silent = data.findings
    .filter((f) => f.status === 'open' && !f.guard)
    .filter((f) => !f.guardNote || f.guardNote.trim() === '')
    .map((f) => f.id)
  assert.deepEqual(silent, [], `open findings need a guardNote saying what is missing: ${silent}`)
})

/*
 * Mechanism G. `status: 'closed'` describes the working tree; an adopter's experience
 * describes the published tarball. On 2026-08-08 two adopters re-hit four findings this
 * ledger listed as closed, because the fixes had been merged and unpublished for four days.
 * The ledger read `Open — 0` and was not lying — it simply had no field for the question.
 *
 * The network half (is `shippedIn` actually on npm?) lives in `pnpm recurrence:shipped`,
 * which the daily docs-freshness workflow runs. `pnpm ready` stays offline.
 */
test('every closed finding declares whether it has shipped', () => {
  const undeclared = data.findings
    .filter((f) => f.status === 'closed')
    .filter((f) => !('shippedIn' in f))
    .map((f) => f.id)
  assert.deepEqual(
    undeclared,
    [],
    'A closed finding must carry `shippedIn`: either the published version an adopter can ' +
      'install the fix from (e.g. "@cascivo/react@0.16.1"), or null for merged-but-unpublished. ' +
      `Without it the ledger cannot tell "done" from "promised": ${undeclared.join(', ')}`,
  )
})

test('shippedIn is a resolvable package@version', () => {
  const malformed = data.findings
    .filter((f) => f.status === 'closed' && f.shippedIn)
    .filter((f) => !/^(@[\w-]+\/)?[\w-]+@\d+\.\d+\.\d+$/.test(f.shippedIn!))
    .map((f) => `${f.id} → ${f.shippedIn}`)
  assert.deepEqual(malformed, [], `shippedIn must be "<package>@<semver>": ${malformed.join(', ')}`)
})

test('every adopter report is triaged into the ledger', async () => {
  const reports = (await readdir(DIR)).filter((f) => f.startsWith('feedback-') && f.endsWith('.md'))
  const referenced = new Set(data.findings.flatMap((f) => f.reports))
  // Reports predating the ledger are grandfathered: their findings are tracked in their own
  // plans. Everything from the 08-06 report on must appear here.
  const LEDGER_START = '2026-07-28'
  const untriaged = reports
    .filter((r) => {
      const date = /(\d{4}-\d{2}-\d{2})\.md$/.exec(r)?.[1]
      return date !== undefined && date >= LEDGER_START
    })
    .filter((r) => !referenced.has(r))
  assert.deepEqual(
    untriaged,
    [],
    `these reports exist but no ledger row references them — triage them into ` +
      `recurrence.json rather than only filing them: ${untriaged.join(', ')}`,
  )
})

test('every referenced report and plan file exists', async () => {
  const missing: string[] = []
  for (const f of data.findings) {
    for (const ref of [...f.reports, ...f.plans]) {
      if (!(await exists(join('docs', 'internal', 'feedback', ref))))
        missing.push(`${f.id} → ${ref}`)
    }
  }
  assert.deepEqual(missing, [], `dangling references in recurrence.json: ${missing.join(', ')}`)
})

test('RECURRENCE.md is regenerated (no drift)', async () => {
  const md = await readFile(join(DIR, 'RECURRENCE.md'), 'utf8')
  assert.ok(
    md.startsWith('<!-- GENERATED by scripts/feedback/recurrence.ts'),
    'RECURRENCE.md must be generated — edit recurrence.json and run `pnpm regen`',
  )
  for (const f of data.findings) {
    assert.ok(
      md.includes(f.title),
      `"${f.title}" is in recurrence.json but not RECURRENCE.md — run \`pnpm regen\``,
    )
  }
})

test('no open finding names a guard that already exists', async () => {
  // Stale bookkeeping in the other direction: a row left `open` with a guardNote saying the
  // guard is "not yet written" while the file sits in the tree. That happened — the WS-1
  // guard shipped and passed while its row still read "specced, not yet written", because
  // the script that was supposed to close it wrote a different file. The ledger is only
  // useful if it is wrong in neither direction.
  const stale: string[] = []
  for (const f of data.findings) {
    if (f.status !== 'open' || !f.guardNote) continue
    for (const m of f.guardNote.matchAll(/([\w./-]+\.test\.ts|[a-z-]+:[a-z-]+)/g)) {
      const named = m[1]!
      if (pkg.scripts[named]) {
        stale.push(`${f.id} → "${named}" is a real npm script`)
        continue
      }
      for (const dir of ['scripts/checks/', '']) {
        if (await exists(dir + named)) {
          stale.push(`${f.id} → ${dir}${named} exists`)
          break
        }
      }
    }
  }
  assert.deepEqual(
    [...new Set(stale)],
    [],
    'These findings are still marked open, but the guard their note says is missing now ' +
      `exists. Close the row (or correct the note):\n  ${[...new Set(stale)].join('\n  ')}`,
  )
})
