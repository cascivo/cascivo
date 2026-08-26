/**
 * Primitive-adoption check.
 *
 * Interactive components consume @cascivo/core primitives, or the sanctioned native
 * platform APIs (native <dialog> for focus trap, popover="auto" for light-dismiss), or
 * the DOM-query "enabled items" roving pattern for dynamically-opened menu content —
 * see CLAUDE.md's "Consume shared headless primitives" table for which shape uses which
 * approach. This check only mechanically enforces the subset that is unambiguous and
 * checkable by static analysis:
 *
 *   1. Static aria-labelledby / aria-describedby string literals — hardcoded ids
 *      collide when a component renders more than once on a page. Use useId().
 *   2. Math.random() in component source — non-deterministic ids cause SSR hydration
 *      mismatches (and are never the right tool for an id). Use useId().
 *   3. Raw document.addEventListener('mousedown'|'click'|'pointerdown') for
 *      outside-click dismissal — reimplements what native popover="auto" (preferred)
 *      or DismissableLayer already get right, including nested-layer, top-first
 *      dismissal. Use one of those instead.
 *
 * It does NOT check which of the two roving-focus shapes (useRovingFocus vs. the
 * DOM-query pattern) a component uses, or whether a native <dialog>/Popover choice was
 * appropriate — those are judgment calls made at review time.
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
// Deferred to 2.0, decided 2026-08-24 during 1.0 readiness (see
// docs/plans/1-0-0-readiness-analysis.md, B7). DismissableLayer wraps its children in its own
// element, so migrating these three changes the rendered DOM and needs a visual layout review
// plus regenerated visual baselines. The stability contract does not cover exact DOM nesting
// (docs/UPGRADING.md), so this is not blocked by 1.0 — it is queued behind it deliberately,
// because a release whose purpose is to stop things moving is the wrong place to move markup.
//
// These are NOT unguarded: each hand-rolls the same outside-click contract the primitive
// provides, and each has its own dismissal tests. What the allowlist records is that they do
// not yet consume the shared primitive.
const OUTSIDE_CLICK_ALLOWLIST: { file: string; reason: string }[] = [
  {
    file: 'packages/components/src/combobox/combobox.tsx',
    reason:
      'deferred to 2.0: DismissableLayer migration changes markup; needs a visual layout review',
  },
  {
    file: 'packages/components/src/date-picker/date-picker.tsx',
    reason:
      'deferred to 2.0: DismissableLayer migration changes markup; needs a visual layout review',
  },
  {
    file: 'packages/components/src/date-range-picker/date-range-picker.tsx',
    reason:
      'deferred to 2.0: DismissableLayer migration changes markup; needs a visual layout review',
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
      // `.ts` as well as `.tsx`: the behavior hooks that build aria ids and CSS anchor
      // names live in plain `.ts` (e.g. popover/use-popover.ts), so a `.tsx`-only sweep
      // misses exactly the files these rules exist for.
      else if (/\.tsx?$/.test(entry) && !entry.includes('.test.')) results.push(full)
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

/**
 * A module-scoped mutable counter feeding a DOM identifier.
 *
 * Added because the aria-id rule above could not see the shape that actually shipped:
 * `Search` built its `<label for>`/`<input id>` pair from `let idCounter = 0`, and
 * `usePopover` built its CSS anchor name the same way. On the server the counter keeps
 * incrementing for the life of the process, so it diverges from a freshly-loaded client on
 * essentially every request — a guaranteed hydration mismatch that React declines to patch
 * up, which can leave the label associated with nothing (2026-07-25 adopter report, #3).
 *
 * Deliberately narrow: it fires only when a file has BOTH a top-level numeric `let`/`var`
 * AND a template literal assigned into an id-ish binding. A counter used for React `key`s
 * or a runtime queue (e.g. `toast`'s `nextToastId`, which is minted on a user action and
 * never during SSR) is not a hydration hazard and does not match.
 */
const MODULE_COUNTER = /^(?:let|var)\s+(\w+)\s*=\s*-?\d+\s*$/gm

/**
 * Does this file interpolate `name` into a template literal? That is the step that turns a
 * counter into a rendered string — and a rendered string built from a module counter is a
 * DOM id, an anchor name, or a `for` attribute. A counter used as a React key or a queue
 * sequence (e.g. `toast`'s `nextToastId`, minted on a user action and never during a server
 * render) never reaches a template literal, so it does not match and needs no allowlist.
 */
function interpolatedIntoTemplate(src: string, name: string): boolean {
  return [...src.matchAll(/`[^`]*`/g)].some((m) =>
    new RegExp(`\\$\\{[^}]*\\b${name}\\b`).test(m[0]),
  )
}

/** Files where a module counter reaches a template literal but is provably SSR-safe. */
const MODULE_COUNTER_ALLOWLIST: { file: string; reason: string }[] = []

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

  it('no module-scoped counter feeding a DOM id (use useId() — SSR hydration)', () => {
    const allow = new Set(MODULE_COUNTER_ALLOWLIST.map((e) => e.file))
    const hits = files
      .filter((f) => !allow.has(f.rel))
      .flatMap((f) => {
        const counters = [...f.src.matchAll(MODULE_COUNTER)].map((m) => m[1]!)
        const rendered = counters.filter((name) => interpolatedIntoTemplate(f.src, name))
        return rendered.flatMap((name) =>
          scan(new RegExp(`^(?:let|var)\\s+${name}\\s*=`), f.src, f.rel),
        )
      })
    report(
      hits,
      'A module-scoped counter used to build a DOM id diverges between the server process ' +
        'and a fresh client, so every SSR render mismatches on hydration. Use useId():',
    )
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
