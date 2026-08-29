/**
 * Reduced-motion completeness guard.
 *
 * cascivo's reduced-motion strategy is *central*: `packages/tokens/src/index.css` collapses
 * every `--cascivo-duration-*` token to `0.01ms` under `@media (prefers-reduced-motion: reduce)`,
 * so any transition or animation whose timing comes from a token is disabled library-wide by
 * one rule. That is the good strategy, and it is the one to keep.
 *
 * It has exactly one hole: a **literal** duration (`1.4s`, `1s`, `300ms`) reads no token, so it
 * silently opts out of the global collapse and needs a hand-written per-file guard instead.
 * That is how the repo ended up with 81 scattered `prefers-reduced-motion` blocks — and how four
 * infinite animations ended up with none at all:
 *
 *   - `components/progress`      `cascivo-progress-indeterminate 1.4s … infinite`  (×2)
 *   - `ai/ai-label`              `cascade-ai-pulse 1.5s … infinite`
 *   - `ai/streaming-text`        `cascade-cursor-blink 1s step-end infinite`
 *   - `ai/terminal`              `cascade-cursor-blink 1s step-end infinite`
 *
 * `media-features.test.ts` was supposed to catch this and did not, because it iterates a
 * hand-written array of 15 component names. `progress` was never on the list and the `ai`
 * package was out of its scope entirely — the "a validator nothing calls is not a guard"
 * failure from CLAUDE.md, in its list-shaped variant. So this check takes the opposite
 * approach and sweeps *every* shipped CSS file; nothing is in scope by virtue of being
 * remembered.
 *
 * The rule: a file that animates or transitions on a literal duration must contain a
 * `@media (prefers-reduced-motion: reduce)` block. Files that time exclusively off
 * `--cascivo-duration-*` / `--cascivo-motion-*` are covered globally and need nothing.
 *
 * Run: `pnpm reduced-motion:check`.
 */

import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')

/**
 * Files allowed to carry a literal duration with a guard that *slows* rather than stops.
 * Every entry needs a reason — a continuous progress indicator that freezes reads as a hung
 * app, so WCAG 2.2 prefers it slowed. These still require a guard; they are exempt only from
 * the expectation that the guard zeroes motion out.
 */
const SLOWED_NOT_STOPPED = new Map<string, string>([
  [
    'packages/components/src/spinner/spinner.module.css',
    'continuous loading indicator — freezing it reads as a hung app, so the guard slows to 1.5s',
  ],
  [
    'packages/components/src/progress-bar/progress-bar.module.css',
    'indeterminate track — same reasoning as spinner, guard slows to 4s',
  ],
])

/** A time value that is not read from a cascivo token. */
const LITERAL_TIME = /(?<![\w-])(\d+(?:\.\d+)?)(ms|s)(?![\w-])/g

/** Declarations whose values carry motion timing. */
const TIMED_DECL =
  /(?:^|[;{])\s*(animation|animation-duration|transition|transition-duration)\s*:([^;}]*)/g

/**
 * Drop `var(--token, <fallback>)` fallbacks. `var(--cascivo-duration-500, 500ms)` reads the
 * token whenever it is defined — and it always is, since every consumer path imports
 * `@cascivo/tokens` — so the literal is a belt-and-braces default, not an opt-out. Treating it
 * as a violation would push authors to *remove* their fallbacks, which is backwards.
 */
function stripVarFallbacks(value: string): string {
  let out = value
  let prev: string
  do {
    prev = out
    out = out.replace(/var\(\s*(--[\w-]+)\s*,[^()]*\)/g, 'var($1)')
  } while (out !== prev)
  return out
}

function collectCss(dir: string): string[] {
  const out: string[] = []
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '__fixtures__') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...collectCss(full))
    else if (entry.endsWith('.css') && full.includes(`${sep}src${sep}`)) out.push(full)
  }
  return out
}

/** Strip comments so commented-out examples never trip the scan. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
}

export interface LiteralTiming {
  line: number
  property: string
  value: string
}

/**
 * Byte offsets covered by a `@media (prefers-reduced-motion: no-preference)` block.
 *
 * That inverse form is the *stronger* pattern — motion is opt-in, so a user who expresses no
 * preference (or whose browser predates the feature) gets no animation at all. `status`,
 * `chart-frame` and `skeleton` already use it. A declaration inside such a block needs no
 * further guard; requiring one would be asking authors to guard motion that cannot run.
 */
function noPreferenceRanges(clean: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = []
  const opener = /@media[^{}]*\(prefers-reduced-motion\s*:\s*no-preference\)[^{}]*\{/g
  for (const match of clean.matchAll(opener)) {
    const start = match.index + match[0].length
    let depth = 1
    let i = start
    while (i < clean.length && depth > 0) {
      if (clean[i] === '{') depth++
      else if (clean[i] === '}') depth--
      i++
    }
    ranges.push([start, i])
  }
  return ranges
}

/**
 * Literal (non-token) durations in motion declarations. A `0s`/`0ms` is not motion, so it is
 * not reported — `transition: none` and explicit zeroing are legitimate.
 */
export function findLiteralTimings(css: string): LiteralTiming[] {
  const clean = stripComments(css)
  const optIn = noPreferenceRanges(clean)
  const found: LiteralTiming[] = []
  for (const decl of clean.matchAll(TIMED_DECL)) {
    const property = decl[1]!
    const value = decl[2]!
    if (optIn.some(([from, to]) => decl.index >= from && decl.index < to)) continue
    const times = [...stripVarFallbacks(value).matchAll(LITERAL_TIME)].filter(
      ([, n]) => Number(n) > 0,
    )
    if (times.length === 0) continue
    found.push({
      line: clean.slice(0, decl.index).split('\n').length,
      property,
      value: value.trim().replace(/\s+/g, ' '),
    })
  }
  return found
}

function hasReducedMotionGuard(css: string): boolean {
  return /@media[^{]*\(prefers-reduced-motion\s*:\s*reduce\)/.test(stripComments(css))
}

describe('reduced-motion:check — literal durations carry a guard', () => {
  const files = collectCss(join(REPO_ROOT, 'packages'))

  it('found the shipped CSS files', () => {
    assert.ok(files.length >= 50, `expected ≥50 shipped CSS files, found ${files.length}`)
  })

  it('every file with a literal motion duration has a prefers-reduced-motion guard', () => {
    const violations: string[] = []
    for (const file of files) {
      const rel = relative(REPO_ROOT, file).split(sep).join('/')
      const css = readFileSync(file, 'utf8')
      const literals = findLiteralTimings(css)
      if (literals.length === 0) continue
      if (hasReducedMotionGuard(css)) continue
      for (const hit of literals) {
        violations.push(`  ${rel}:${hit.line}\n    ${hit.property}: ${hit.value}`)
      }
    }
    if (violations.length > 0) {
      assert.fail(
        `motion on a literal duration with no @media (prefers-reduced-motion: reduce) guard.\n` +
          `A literal reads no token, so the global duration collapse in packages/tokens/src/index.css\n` +
          `does not reach it:\n${violations.join('\n')}\n` +
          `  fix: time it off --cascivo-duration-* (preferred — covered globally), or add a guard.`,
      )
    }
  })

  it('the slowed-not-stopped allowlist is current', () => {
    const stale: string[] = []
    for (const [rel, reason] of SLOWED_NOT_STOPPED) {
      const css = readFileSync(join(REPO_ROOT, rel), 'utf8')
      if (findLiteralTimings(css).length === 0) {
        stale.push(`  ${rel} — no literal timing left; drop the entry (${reason})`)
      }
    }
    assert.equal(stale.length, 0, `stale allowlist entries:\n${stale.join('\n')}`)
  })
})
