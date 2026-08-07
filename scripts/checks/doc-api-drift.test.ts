/**
 * Doc/API drift guard (WS-10) — the enforcement that keeps the adopter-facing docs
 * from teaching an API the code no longer has.
 *
 * The recurrence this repo keeps hitting: a code/type change ships, but the guides
 * (and the pasteable `AI-RULES.md` contract) keep describing the pre-change API, so
 * the next adopter copies a snippet that no longer type-checks and re-reports it.
 * The canonical instance was `useTheme()` returning a plain `string` on 0.11.0 while
 * three guides still said "returns a signal — read `theme.value`".
 *
 * Two checks:
 *   1. A source-level probe pins the `useTheme` return contract, so if the code
 *      reverts to a signal the guides' string guidance is caught HERE, in the same PR.
 *   2. A blocklist scan of the adopter-facing guides for known stale-API phrasings.
 *      Add a phrasing to STALE_PATTERNS whenever an API changes shape, so the prose
 *      can't silently drift back. (UPGRADING.md is excluded — it documents the
 *      before/after of exactly these migrations and legitimately quotes the old form.)
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))

describe('doc/API drift — useTheme contract', () => {
  it('useTheme returns a string first element (not a Signal)', () => {
    const src = readFileSync(join(REPO_ROOT, 'packages/core/src/theme.tsx'), 'utf8')
    // The explicit return annotation of `export function useTheme(): <here>`.
    const m = src.match(/export function useTheme\(\):\s*([^{]+)\{/)
    assert.ok(m, 'could not find useTheme return annotation in theme.tsx')
    const ret = m[1]!.trim()
    assert.match(
      ret,
      /readonly \[string,/,
      `useTheme must return a tuple whose first element is a plain string, got: ${ret}`,
    )
    assert.doesNotMatch(
      ret,
      /Signal/,
      `useTheme return type mentions Signal — if the API changed, update the guides ` +
        `(AI-RULES.md, GETTING-STARTED.md, THEMING.md, …) and this probe together. Got: ${ret}`,
    )
  })
})

describe('doc/API drift — adopter-facing guides carry no stale API phrasings', () => {
  // Guides an adopter (or an agent) reads directly. NOT UPGRADING.md (migration notes).
  const GUIDES = [
    'docs/AI-RULES.md',
    'docs/GETTING-STARTED.md',
    'docs/THEMING.md',
    'docs/MIGRATING-FROM-SHADCN.md',
    'docs/ENTERPRISE-READINESS.md',
    'docs/HEADLESS.md',
  ]

  // Patterns that only appear when a guide *uses* a since-removed API shape. These
  // match old-API code (`{theme.value}`, `theme.value ===`, `setTheme(theme.value`),
  // NOT prose that names the old form to warn against it ("never `theme.value`").
  const STALE_PATTERNS: { pattern: RegExp; why: string }[] = [
    {
      pattern: /\{theme\.value\}/,
      why: 'useTheme() returns a string since 0.11.0 — render `theme`, not `theme.value`',
    },
    {
      pattern: /theme\.value\s*===/,
      why: 'compare `theme` directly (`theme === "dark"`), not `theme.value`',
    },
    {
      pattern: /setTheme\(theme\.value/,
      why: 'pass `theme`, not `theme.value`, since useTheme() returns a string',
    },
    { pattern: /\[Signal<string>, setTheme\]/, why: 'useTheme() no longer returns a signal tuple' },
    {
      pattern: /reactive \[signal, setter\]/,
      why: 'useTheme() returns [string, setter], not [signal, setter]',
    },
  ]

  it('no guide contains a blocklisted stale-API phrasing', () => {
    const hits: string[] = []
    for (const rel of GUIDES) {
      const text = readFileSync(join(REPO_ROOT, rel), 'utf8')
      const lines = text.split('\n')
      for (let i = 0; i < lines.length; i++) {
        for (const { pattern, why } of STALE_PATTERNS) {
          if (pattern.test(lines[i]!)) hits.push(`  ${rel}:${i + 1}  /${pattern.source}/ — ${why}`)
        }
      }
    }
    assert.deepEqual(
      hits,
      [],
      `Adopter-facing guides teach a stale API (update them to the current contract):\n${hits.join('\n')}`,
    )
  })
})
