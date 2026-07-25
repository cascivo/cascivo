/**
 * Reactivity-contract parity guard (2026-07-25 plan, WS-14 / mechanism A).
 *
 * The recurrence this closes: a **behavioral claim that exists only as prose**.
 * `docs/HEADLESS.md` promised twelve self-subscribing hooks; the test locking that promise
 * covered three; the two it was silently wrong about were the two an adopter reaches for
 * first, and the result was a dashboard whose UI never responded to input, with no error.
 *
 * `doc-api-drift.test.ts` is the complementary guard, and structurally cannot catch this:
 * it matches phrasings already known to be stale. This one asserts the claim itself, in
 * both directions:
 *
 *   docs list  ->  contract entry  ->  `useSignals()` in the source  ->  a test case
 *
 * so a hook cannot be documented as self-subscribing without being one, and cannot quietly
 * stop being one without a test going red.
 *
 * Run: `pnpm meta:check` (or `node --experimental-strip-types --test scripts/checks/self-subscribe-parity.test.ts`).
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { NOT_SELF_SUBSCRIBING, SELF_SUBSCRIBING_HOOKS } from './self-subscribe-contract.ts'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const HEADLESS = join(REPO_ROOT, 'docs/HEADLESS.md')

function read(rel: string): string {
  return readFileSync(join(REPO_ROOT, rel), 'utf8')
}

/** Drop line and block comments so prose about a call can never pass for the call. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

/**
 * The body of `export function <name>(…) { … }`, brace-matched. Returns null when the
 * function isn't found, which the caller reports as a failure — a renamed hook must be
 * renamed in the contract too.
 */
function functionBody(src: string, name: string): string | null {
  const decl = new RegExp(`export function ${name}\\b`).exec(src)
  if (!decl) return null

  // Find the BODY's opening brace, not a `{}` inside the signature — `useRovingFocus(
  // options: UseRovingFocusOptions = {})` has a default-parameter object literal that a
  // naive `indexOf('{')` mistakes for the body, yielding an empty body that never matches.
  // Balance the parameter parens first, then take the next `{`.
  let parens = 0
  let seenParen = false
  let open = -1
  for (let i = decl.index; i < src.length; i++) {
    const ch = src[i]
    if (ch === '(') {
      parens++
      seenParen = true
    } else if (ch === ')') parens--
    else if (ch === '{' && seenParen && parens === 0) {
      open = i
      break
    }
  }
  if (open === -1) return null

  let depth = 0
  for (let i = open; i < src.length; i++) {
    const ch = src[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return src.slice(open, i + 1)
    }
  }
  return null
}

/**
 * The docs sentence that enumerates the self-subscribing hooks. Kept as one paragraph so
 * this guard has an unambiguous region to parse — if you reformat it, keep every hook name
 * inside backticks in the same paragraph.
 */
function docsHookList(): string[] {
  const md = readFileSync(HEADLESS, 'utf8')
  const marker = 'all call `useSignals()` for you'
  const at = md.indexOf(marker)
  assert.ok(
    at !== -1,
    `docs/HEADLESS.md no longer contains the self-subscribing-hooks sentence ` +
      `("${marker}"). If the contract changed, update scripts/checks/self-subscribe-contract.ts ` +
      `and this guard together — do not just delete the sentence.`,
  )
  // The claim's paragraph: back to the previous blank line, forward to the next one.
  const start = md.lastIndexOf('\n\n', at)
  const end = md.indexOf('\n\n', at)
  const paragraph = md.slice(start === -1 ? 0 : start, end === -1 ? md.length : end)
  return [...paragraph.matchAll(/`(use[A-Z]\w*)`/g)].map((m) => m[1]!)
}

describe('reactivity contract — every documented self-subscribing hook really is one', () => {
  for (const hook of SELF_SUBSCRIBING_HOOKS) {
    const symbol = hook.bodyOf ?? hook.name
    it(`${hook.name} calls useSignals() inside ${symbol}() in ${hook.source}`, () => {
      const body = functionBody(stripComments(read(hook.source)), symbol)
      assert.ok(
        body !== null,
        `Could not find \`export function ${symbol}\` in ${hook.source}. If the hook moved ` +
          `or was renamed, update scripts/checks/self-subscribe-contract.ts.`,
      )
      assert.match(
        body,
        /useSignals\(\)/,
        `${hook.name} is documented as self-subscribing, but ${symbol}()'s body in ` +
          `${hook.source} never calls useSignals(). Either call it (so a consumer reading ` +
          `the returned signal in render re-renders without the Babel transform), or remove ` +
          `${hook.name} from the docs list AND from ` +
          `scripts/checks/self-subscribe-contract.ts.`,
      )
    })

    it(`${hook.name} has a reactivity test in ${hook.test}`, () => {
      const test = read(hook.test)
      assert.ok(
        test.includes(hook.name),
        `${hook.test} does not mention ${hook.name}. Every hook on the contract needs a ` +
          `case that renders a plain React component (no Babel signals transform), writes, ` +
          `and asserts the DOM changed — prose is what failed last time.`,
      )
    })
  }
})

describe('reactivity contract — the docs and the contract agree, both ways', () => {
  it('every hook named in docs/HEADLESS.md is on the contract', () => {
    const documented = docsHookList()
    const known = new Set(SELF_SUBSCRIBING_HOOKS.map((h) => h.name))
    const missing = documented.filter((name) => !known.has(name))
    assert.deepEqual(
      missing,
      [],
      `docs/HEADLESS.md claims these hooks call useSignals() for you, but they are not on ` +
        `the contract, so nothing verifies the claim: ${missing.join(', ')}. Add them to ` +
        `scripts/checks/self-subscribe-contract.ts with a test.`,
    )
  })

  it('every hook on the contract is named in docs/HEADLESS.md', () => {
    const documented = new Set(docsHookList())
    const undocumented = SELF_SUBSCRIBING_HOOKS.map((h) => h.name).filter(
      (name) => !documented.has(name),
    )
    assert.deepEqual(
      undocumented,
      [],
      `These hooks self-subscribe and are tested, but docs/HEADLESS.md does not list them, ` +
        `so an adopter will add a redundant useSignals(): ${undocumented.join(', ')}.`,
    )
  })

  it('hooks that deliberately do NOT self-subscribe are not claimed to', () => {
    const documented = new Set(docsHookList())
    for (const { name, why } of NOT_SELF_SUBSCRIBING) {
      assert.ok(
        !documented.has(name),
        `docs/HEADLESS.md lists ${name} as self-subscribing, but the contract records that ` +
          `it deliberately does not: ${why}`,
      )
    }
  })
})

describe('reactivity contract — the boundary rule is still documented', () => {
  it('HEADLESS.md still tells readers when useSignals() IS required', () => {
    const md = readFileSync(HEADLESS, 'utf8')
    assert.match(
      md,
      /useSignals\(\)/,
      'HEADLESS.md must keep the rule for signals that do NOT come from a hook — a ' +
        'module-level signal(), a signal passed as a prop, or currentLocale(). Wrapping ' +
        'the hooks narrowed that rule; it did not remove it.',
    )
    assert.ok(
      md.includes('currentLocale()'),
      'HEADLESS.md must keep naming currentLocale() as the plain-function exception: it ' +
        'cannot self-subscribe, so a component reading it in render needs useSignals().',
    )
  })
})
