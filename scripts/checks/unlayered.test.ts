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

/*
 * CSS the CLI *generates* is shipped CSS too — it just does not live in a .css file.
 *
 * `cascivo create`'s index.html declared the layer order, and its sibling AGENTS.md told the
 * agent "never emit unlayered CSS", and then the same file emitted
 * `html, body, #root { height: 100% }` outside every layer (2026-08-08 report B). The guard
 * above could not see it because it globs `packages/**\/src\/**\/*.css`, so the one template
 * every new adopter starts from was the one file exempt from the rule it teaches.
 */
describe('unlayered:check — CSS inside CLI templates lives inside @layer', () => {
  const TEMPLATE_SOURCES = [
    'packages/cli/src/commands/create.ts',
    'packages/cli/src/commands/init.ts',
  ]

  for (const rel of TEMPLATE_SOURCES) {
    it(`${rel} emits no unlayered rules`, () => {
      let source: string
      try {
        source = readFileSync(join(REPO_ROOT, rel), 'utf8')
      } catch {
        return // command removed; nothing to check
      }

      // Pull every <style>…</style> block out of the generated HTML templates.
      const blocks = [...source.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]!)
      const violations: string[] = []
      for (const css of blocks) {
        // Templates are JS template literals: drop interpolations before parsing.
        const cleaned = css.replace(/\$\{[^}]*\}/g, 'x')
        for (const rule of findUnlayeredRules(cleaned)) {
          violations.push(`  ${rel}: ${rule.selector} { … }  (outside @layer)`)
        }
      }
      assert.deepEqual(
        violations,
        [],
        `The CLI generates unlayered CSS:\n${violations.join('\n')}\n` +
          `  fix: wrap it in @layer cascivo.base { … } — the same rule the generated ` +
          `AGENTS.md gives the adopter.`,
      )
    })
  }
})
