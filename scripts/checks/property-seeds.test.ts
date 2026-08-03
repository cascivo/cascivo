/**
 * Property tests must be seeded.
 *
 * `fc.assert(prop)` with no options uses a clock-derived seed, so it runs a *different* 100
 * inputs on every invocation. That makes a counterexample appear once in CI and vanish on
 * re-run — the worst possible failure shape, because the honest reading of a green re-run is
 * "probably infrastructure" and the bug survives.
 *
 * It cost exactly that here. `charts/src/engine/stats.test.ts`'s `bins cover [min, max]`
 * failed once in an aggregate run, then passed 3/3 on re-run and 12/12 in isolation. The
 * underlying defects were real and had to be found by hand instead: `binValues` dropped a
 * count when the range was too narrow to divide (`width` underflowed to 0, so
 * `(v - min) / width` became `NaN` and `bins[NaN]` swallowed it), and its final bin edge
 * landed short of `max` by more than the assertion's relative epsilon could express at
 * subnormal scales.
 *
 * CLAUDE.md already requires deterministic tests. This makes it checkable: every `fc.assert`
 * must pass an options object carrying a `seed`, so the suite either always passes or always
 * fails and a failure is debuggable from the seed alone.
 *
 * Run: `pnpm meta:check`.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const ROOTS = ['packages', 'scripts', 'apps']

/** This guard's own prose mentions `fc.assert` repeatedly; it is not a call site. */
const SELF = 'scripts/checks/property-seeds.test.ts'

/** Comments and string literals blanked, so a doc mention is never read as a call. */
function codeOnly(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
    .replace(/`(?:[^`\\]|\\[\s\S])*`/g, '``')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
}

function testFiles(dir: string): string[] {
  const out: string[] = []
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === 'dist') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...testFiles(full))
    else if (/\.test\.tsx?$/.test(entry)) out.push(full)
  }
  return out
}

/**
 * Every `fc.assert(` call site, as `[file, lineNumber, callText]`.
 *
 * Brace-matched from the opening paren rather than regex-matched to the end of line: these
 * calls span many lines and nest their own parens, so a line-based scan cannot tell whether
 * the options argument is present.
 */
function assertCalls(): Array<{ file: string; line: number; text: string }> {
  const calls: Array<{ file: string; line: number; text: string }> = []
  for (const root of ROOTS) {
    for (const file of testFiles(join(REPO_ROOT, root))) {
      if (relative(REPO_ROOT, file) === SELF) continue
      const src = codeOnly(readFileSync(file, 'utf8'))
      if (!src.includes('fc.assert')) continue
      for (const m of src.matchAll(/fc\.assert\(/g)) {
        const open = m.index + m[0].length - 1
        let depth = 0
        let end = open
        for (let i = open; i < src.length; i++) {
          if (src[i] === '(') depth++
          else if (src[i] === ')') {
            depth--
            if (depth === 0) {
              end = i
              break
            }
          }
        }
        calls.push({
          file: relative(REPO_ROOT, file),
          line: src.slice(0, m.index).split('\n').length,
          text: src.slice(open + 1, end),
        })
      }
    }
  }
  return calls
}

describe('property-seeds — every fast-check property test is reproducible', () => {
  const calls = assertCalls()

  it('finds the property tests', () => {
    // A resolution bug here would make the guard pass vacuously, which is the one outcome
    // worse than the flake it exists to prevent.
    assert.ok(calls.length >= 4, `only ${calls.length} fc.assert call(s) found — scan broken?`)
  })

  it('every fc.assert passes a seed', () => {
    const unseeded = calls
      // A seed can arrive inline (`{ seed: 1 }`) or via a named config object, which is the
      // convention in this repo (`DETERMINISTIC`). Accept either; require one.
      .filter(({ text }) => !/\bseed\b/.test(text) && !/\bDETERMINISTIC\b/.test(text))
      .map(({ file, line }) => `  ${file}:${line}`)

    assert.deepEqual(
      unseeded,
      [],
      'These fc.assert calls run a different input set every time, so a counterexample\n' +
        'appears once and vanishes on re-run:\n' +
        `${unseeded.join('\n')}\n\n` +
        'Pass a fixed seed — the convention is a file-local\n' +
        '`const DETERMINISTIC = { seed: 0x5ca1ab1e, numRuns: 2000 } as const`, spread as the\n' +
        'second argument. Raise numRuns above the default 100 to replace the breadth the\n' +
        'varying seed used to provide.',
    )
  })

  it('seeded properties raise numRuns above the default', () => {
    // A fixed seed with only 100 runs is deterministic but narrow — it locks in one small
    // sample forever. The point is reproducibility AND coverage.
    const narrow: string[] = []
    for (const root of ROOTS) {
      for (const file of testFiles(join(REPO_ROOT, root))) {
        if (relative(REPO_ROOT, file) === SELF) continue
        const src = readFileSync(file, 'utf8')
        if (!codeOnly(src).includes('fc.assert')) continue
        const config = /seed:\s*[^,}]+,\s*numRuns:\s*(\d+)/.exec(src)
        if (config === null) {
          narrow.push(`${relative(REPO_ROOT, file)} (no numRuns beside seed)`)
          continue
        }
        if (Number(config[1]) < 500) {
          narrow.push(`${relative(REPO_ROOT, file)} (numRuns ${config[1]} < 500)`)
        }
      }
    }
    assert.deepEqual(narrow, [], `Seeded but narrow:\n  ${narrow.join('\n  ')}`)
  })
})
