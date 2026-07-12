/**
 * Primitive-adoption check.
 *
 * Interactive components must consume the shared @cascivo/core headless primitives
 * (useId, DismissableLayer, useRovingFocus, useTypeahead, FocusScope) instead of
 * hand-rolling accessibility mechanics that drift and break. This check catches the
 * high-signal, unambiguous regressions:
 *
 *   1. Static aria-labelledby / aria-describedby string literals — hardcoded ids
 *      collide when a component renders more than once on a page. Use useId().
 *   2. Math.random() in component source — non-deterministic ids cause SSR hydration
 *      mismatches (and are never the right tool for an id). Use useId().
 *   3. Raw document.addEventListener('mousedown'|'click'|'pointerdown') for
 *      outside-click dismissal — reimplements DismissableLayer (which also gets
 *      nested-layer, top-first dismissal right). Use DismissableLayer.
 *
 * Known-remaining sites are tracked in the allowlists below (debt register), mirroring
 * scripts/checks/breakpoint-allowlist.ts. To clear one: migrate to the primitive and
 * delete the entry. New violations fail the check.
 */

import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const SCAN_ROOTS = ['packages/components/src', 'packages/layouts/src']

// Files with a sanctioned outside-click listener not yet migrated to DismissableLayer.
// Migrating these wraps markup in DismissableLayer's element, which needs a visual
// layout check — tracked as follow-up rather than done blind.
const OUTSIDE_CLICK_ALLOWLIST: { file: string; reason: string }[] = [
  {
    file: 'packages/components/src/combobox/combobox.tsx',
    reason: 'follow-up: migrate outside-click to DismissableLayer (wrapper-div layout review)',
  },
  {
    file: 'packages/components/src/date-picker/date-picker.tsx',
    reason: 'follow-up: migrate outside-click to DismissableLayer (wrapper-div layout review)',
  },
  {
    file: 'packages/components/src/date-range-picker/date-range-picker.tsx',
    reason: 'follow-up: migrate outside-click to DismissableLayer (wrapper-div layout review)',
  },
]

// No sanctioned static aria-id literals or Math.random() ids remain — keep these empty
// so any reintroduction fails the check.
const ARIA_ID_ALLOWLIST: string[] = []
const RANDOM_ID_ALLOWLIST: string[] = []

function collectTsx(dir: string): string[] {
  const results: string[] = []
  try {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === 'dist') continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) results.push(...collectTsx(full))
      else if (entry.endsWith('.tsx') && !entry.includes('.test.')) results.push(full)
    }
  } catch {
    // skip unreadable dirs
  }
  return results
}

interface Hit {
  file: string
  line: number
  context: string
}

function scan(re: RegExp, source: string, rel: string): Hit[] {
  const hits: Hit[] = []
  const lines = source.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    re.lastIndex = 0
    if (re.test(line)) hits.push({ file: rel, line: i + 1, context: line.trim() })
  }
  return hits
}

const files = SCAN_ROOTS.flatMap((r) => collectTsx(join(REPO_ROOT, r))).map((f) => ({
  abs: f,
  rel: relative(REPO_ROOT, f),
  src: readFileSync(f, 'utf8'),
}))

const STATIC_ARIA_ID = /aria-(?:labelledby|describedby)="[^"]/
const RANDOM_ID = /Math\.random\(/
const OUTSIDE_CLICK = /document\.addEventListener\(\s*['"](?:mousedown|click|pointerdown)['"]/

function report(hits: Hit[], guidance: string): void {
  if (hits.length === 0) return
  const msg = hits.map((h) => `  ${h.file}:${h.line}  ${h.context.slice(0, 90)}`).join('\n')
  assert.fail(`${guidance}\n${msg}`)
}

describe('primitive-adoption:check — components consume shared headless primitives', () => {
  it('no static aria-labelledby / aria-describedby string literals (use useId())', () => {
    const hits = files
      .flatMap((f) => scan(STATIC_ARIA_ID, f.src, f.rel))
      .filter((h) => !ARIA_ID_ALLOWLIST.includes(h.file))
    report(hits, 'Hardcoded aria id literals collide across instances — use useId():')
  })

  it('no Math.random() in component source (non-deterministic ids → SSR mismatch)', () => {
    const hits = files
      .flatMap((f) => scan(RANDOM_ID, f.src, f.rel))
      .filter((h) => !RANDOM_ID_ALLOWLIST.includes(h.file))
    report(hits, 'Math.random() is not a stable id — use useId():')
  })

  it('no new raw outside-click listeners (use DismissableLayer)', () => {
    const allow = new Set(OUTSIDE_CLICK_ALLOWLIST.map((e) => e.file))
    const hits = files
      .flatMap((f) => scan(OUTSIDE_CLICK, f.src, f.rel))
      .filter((h) => !allow.has(h.file))
    report(hits, 'Raw outside-click listener reimplements DismissableLayer — use it instead:')
  })

  it('outside-click allowlist has no stale entries', () => {
    const stale = OUTSIDE_CLICK_ALLOWLIST.filter((e) => {
      const f = files.find((x) => x.rel === e.file)
      return !f || !OUTSIDE_CLICK.test(f.src)
    })
    if (stale.length > 0) {
      assert.fail(
        `Stale primitive-adoption allowlist entries (migrated already — remove them):\n${stale
          .map((s) => `  ${s.file}`)
          .join('\n')}`,
      )
    }
  })
})
