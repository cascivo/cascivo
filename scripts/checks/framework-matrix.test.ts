/**
 * Framework-matrix guard — a ✅ must have something executable behind it.
 *
 * `docs/COMPATIBILITY.md` listed **Astro ✅ Yes**, unqualified, with the note "Works as a
 * React island; import CSS in a shared layout". A 2026-07-28 adopter built on that and found
 * that Astro drops per-component CSS for SSR'd islands, so `client:load` and
 * `client:visible` — the majority of islands in the wild — render completely unstyled with
 * no warning. The same page listed **Preact ✅ Yes / Verified in production**, which was
 * true of the Vite CSR setup the guide describes and false under Astro's compat aliasing,
 * where the build dies outright (report C2, C3).
 *
 * Neither ✅ was dishonest when written. Both were untested claims that nothing could
 * contradict — Mechanism A, applied to a support matrix.
 *
 * So a ✅ now has to name a **verifying artifact that exists**: an `apps/examples/*` app, or
 * a job in a CI workflow. Anything cascivo cannot demonstrate is graded ⚠️ with a link to
 * the guide explaining the caveat. That turns "supported" from an assertion into a claim
 * with evidence behind it, and makes downgrading a row the cheap, obvious move when
 * evidence is missing.
 *
 * Run: `pnpm meta:check`.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const MATRIX = join(REPO_ROOT, 'docs/COMPATIBILITY.md')
const EXAMPLES = join(REPO_ROOT, 'apps/examples')
const WORKFLOWS = join(REPO_ROOT, '.github/workflows')

/**
 * Rows whose evidence is not an example app, with what stands in for one.
 *
 * Keep this honest: "the whole repo uses it" is a real answer for React; "we're pretty sure"
 * is not an answer for anything.
 */
const EVIDENCE: Record<string, string> = {
  'React 18 / 19': 'every package and app in this repo builds and tests on it',
  'Vue / Svelte / Angular': 'graded ⚠️ — tokens/themes only, no component claim',
  'Preact 10 (`preact/compat`)':
    'the dedicated "preact" vitest projects in packages/components and packages/charts, ' +
    'which mount the interactive family and the charts under a real preact/compat alias ' +
    'and assert no console errors (see packages/components/src/preact-compat.test.tsx)',
}

interface Row {
  framework: string
  supported: string
  notes: string
}

/** Parse the "## Frameworks" table. */
function frameworkRows(): Row[] {
  const source = readFileSync(MATRIX, 'utf8')
  const start = source.indexOf('## Frameworks')
  assert.ok(start !== -1, 'docs/COMPATIBILITY.md has no "## Frameworks" section')
  const section = source.slice(start, source.indexOf('\n## ', start + 1))
  const rows: Row[] = []
  for (const line of section.split('\n')) {
    if (!line.startsWith('|')) continue
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim())
    if (cells.length < 3) continue
    if (/^-+$/.test(cells[0]!.replace(/[\s-]/g, '-'))) continue
    if (cells[0] === 'Framework') continue
    rows.push({ framework: cells[0]!, supported: cells[1]!, notes: cells[2]! })
  }
  return rows
}

function exampleApps(): string[] {
  try {
    return readdirSync(EXAMPLES, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
  } catch {
    return []
  }
}

function workflowText(): string {
  try {
    return readdirSync(WORKFLOWS)
      .map((f) => readFileSync(join(WORKFLOWS, f), 'utf8'))
      .join('\n')
  } catch {
    return ''
  }
}

describe('framework-matrix — every ✅ names evidence that exists', () => {
  it('parses the framework table (guards against passing vacuously)', () => {
    const rows = frameworkRows()
    assert.ok(rows.length >= 5, `expected at least 5 framework rows, parsed ${rows.length}`)
    assert.ok(
      rows.some((r) => r.framework.includes('Astro')),
      `expected an Astro row; parsed: ${rows.map((r) => r.framework).join(', ')}`,
    )
  })

  it('each supported framework is backed by an example app, a CI job, or a stated reason', () => {
    const apps = exampleApps()
    const ci = workflowText()
    const unproven: string[] = []

    for (const row of frameworkRows()) {
      if (!row.supported.includes('✅')) continue // ⚠️/❌ rows carry their own caveat
      if (row.framework in EVIDENCE) continue

      // An example app named in the row's notes, or one whose directory name the row
      // plainly refers to (react-vite, react-next, react-vite-ssr…).
      const named = apps.some(
        (app) => row.notes.includes(app) || row.notes.includes(`apps/examples/${app}`),
      )
      // …or a CI job that names the framework.
      const firstWord = row.framework.replace(/[^\w.+/ ]/g, '').split(/[\s/]/)[0] ?? ''
      const inCi = firstWord.length > 2 && ci.toLowerCase().includes(firstWord.toLowerCase())

      if (!named && !inCi) {
        unproven.push(`${row.framework} — marked "${row.supported}" with no example app or CI job`)
      }
    }

    assert.deepEqual(
      unproven,
      [],
      'These frameworks are marked supported with nothing executable behind the claim. ' +
        'An unqualified ✅ is what sent a 2026-07-28 adopter into an Astro build that ' +
        'silently drops every component stylesheet (report C2/C3).\n' +
        'Either add an apps/examples/* app (or a CI job) that exercises it, downgrade the ' +
        'row to ⚠️ with the caveat and a guide link, or add it to EVIDENCE in this guard ' +
        `with the reason.\n  ${unproven.join('\n  ')}`,
    )
  })

  it('every guide a matrix row links to exists', () => {
    const missing: string[] = []
    for (const row of frameworkRows()) {
      for (const match of row.notes.matchAll(/\]\((\.\/[\w.-]+\.md)\)/g)) {
        const target = join(REPO_ROOT, 'docs', match[1]!.replace('./', ''))
        if (!existsSync(target)) missing.push(`${row.framework} → ${match[1]}`)
      }
    }
    assert.deepEqual(
      missing,
      [],
      `A framework row links to a guide that does not exist:\n  ${missing.join('\n  ')}`,
    )
  })
})
