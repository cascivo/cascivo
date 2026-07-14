/**
 * Zero-unlayered guard for shipped/copied CSS.
 *
 * Every declaration cascivo ships (and every component copied by cascivo add)
 * must live inside an @layer block. Unlayered author CSS beats every layered
 * rule regardless of specificity, so one stray unlayered rule silently defeats
 * the whole layer system - the exact "unlayered wins" trap the AI-first dashboard
 * report flagged. This check scans packages CSS under src and fails on any
 * top-level style rule outside @layer.
 *
 * Deliberate exceptions live in ALLOWLIST below (Tailwind v4 bridge, which is
 * unlayered by design). Test fixtures under __fixtures__ are skipped - they are
 * intentionally dirty inputs for the CLI audit tests.
 *
 * Run with: pnpm unlayered:check.
 */

import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, it } from 'node:test'
import { findUnlayeredRules } from '../../packages/cli/src/utils/css-layers.ts'

const REPO_ROOT = join(import.meta.dirname, '../..')

// Files that are unlayered on purpose (relative to REPO_ROOT).
const ALLOWLIST = new Set(['packages/themes/src/tailwind.css'])

function collectCss(dir: string): string[] {
  const results: string[] = []
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return results
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '__fixtures__') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) results.push(...collectCss(full))
    else if (entry.endsWith('.css') && full.includes(`${sep}src${sep}`)) results.push(full)
  }
  return results
}

describe('unlayered:check — shipped CSS lives inside @layer', () => {
  const files = collectCss(join(REPO_ROOT, 'packages'))

  it('found the shipped CSS files', () => {
    assert.ok(files.length >= 50, `expected ≥50 shipped CSS files, found ${files.length}`)
  })

  it('no shipped style rule is unlayered', () => {
    const violations: string[] = []
    for (const file of files) {
      const rel = relative(REPO_ROOT, file)
      if (ALLOWLIST.has(rel)) continue
      const unlayered = findUnlayeredRules(readFileSync(file, 'utf8'))
      for (const rule of unlayered) {
        violations.push(`  ${rel}:${rule.line}\n    ${rule.selector} { … }  (outside @layer)`)
      }
    }
    if (violations.length > 0) {
      assert.fail(
        `unlayered style rules in shipped CSS (they beat every cascivo layer):\n` +
          `${violations.join('\n')}\n` +
          `  fix: wrap in @layer cascivo.component { … } (or the correct layer).`,
      )
    }
  })
})
