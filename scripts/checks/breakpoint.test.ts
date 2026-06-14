/**
 * Breakpoint literal check — v20 enforcement.
 *
 * Scans all CSS files in packages/ for @media and @container width conditions
 * and asserts each length literal is on the canonical scale:
 *   sm=30rem, md=40rem, lg=64rem, xl=80rem
 *
 * Off-scale literals are tracked in breakpoint-allowlist.ts (debt register).
 * To add a sanctioned exception: add an entry with a reason.
 * To fix a violation: migrate to the nearest canonical value and delete the entry.
 */

import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname, relative } from 'node:path'
import { describe, it } from 'node:test'
import { BREAKPOINT_ALLOWLIST } from './breakpoint-allowlist.ts'

const REPO_ROOT = join(import.meta.dirname, '../..')

// Canonical scale — values that ARE allowed in width conditions
const CANONICAL_REM = new Set(['30rem', '40rem', '64rem', '80rem'])
// Pixel equivalents at 16px root
const CANONICAL_PX = new Set(['480px', '640px', '1024px', '1280px'])

function isCanonical(value: string): boolean {
  return CANONICAL_REM.has(value) || CANONICAL_PX.has(value)
}

function collectCssFiles(dir: string): string[] {
  const results: string[] = []
  try {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) results.push(...collectCssFiles(full))
      else if (extname(entry) === '.css') results.push(full)
    }
  } catch {
    // skip unreadable dirs
  }
  return results
}

interface Violation {
  file: string
  line: number
  value: string
  context: string
}

function scanCssForOffScaleWidths(cssSource: string, filename: string): Violation[] {
  const violations: Violation[] = []
  const lines = cssSource.split('\n')
  // Match @media or @container lines containing width conditions
  const widthCondRe =
    /(?:min-width|max-width|width|min-inline-size|max-inline-size|inline-size)\s*:\s*([\d.]+(?:rem|px|em))/g

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    const trimmed = line.trim()
    // Only check lines inside @media or @container rules
    if (!trimmed.startsWith('@media') && !trimmed.startsWith('@container')) continue
    // Skip non-width media conditions
    if (
      /prefers|forced|pointer|hover|aspect|color|resolution|orientation|print|screen/.test(trimmed)
    )
      continue

    let match: RegExpExecArray | null
    widthCondRe.lastIndex = 0
    while ((match = widthCondRe.exec(trimmed)) !== null) {
      const value = match[1] ?? ''
      if (!isCanonical(value)) {
        violations.push({ file: filename, line: i + 1, value, context: trimmed })
      }
    }
  }
  return violations
}

describe('breakpoint:check — no off-scale width literals', () => {
  const packagesDir = join(REPO_ROOT, 'packages')
  const cssFiles = collectCssFiles(packagesDir)

  const allowlistKeys = new Set(BREAKPOINT_ALLOWLIST.map((e) => `${e.file}:${e.value}`))

  it('all @media/@container width conditions use canonical scale values', () => {
    const realViolations: Violation[] = []

    for (const file of cssFiles) {
      const source = readFileSync(file, 'utf8')
      const relFile = relative(REPO_ROOT, file)
      const violations = scanCssForOffScaleWidths(source, relFile)
      for (const v of violations) {
        const key = `${v.file}:${v.value}`
        if (!allowlistKeys.has(key)) {
          realViolations.push(v)
        }
      }
    }

    if (realViolations.length > 0) {
      const msg = realViolations
        .map(
          (v) =>
            `  ${v.file}:${v.line}  off-scale: ${v.value}  (use 30rem/40rem/64rem/80rem)  [${v.context.slice(0, 80)}]`,
        )
        .join('\n')
      assert.fail(`Off-scale breakpoint literals found (not in allowlist):\n${msg}`)
    }
  })

  it('allowlist has no stale entries (all allowlisted values still exist in files)', () => {
    // This test warns if an allowlist entry no longer exists in any CSS file
    // (meaning it was already migrated but the entry wasn't removed).
    const allCssContent = cssFiles.map((f) => ({
      rel: relative(REPO_ROOT, f),
      content: readFileSync(f, 'utf8'),
    }))

    const staleEntries: string[] = []
    for (const entry of BREAKPOINT_ALLOWLIST) {
      const fileContent = allCssContent.find((c) => c.rel === entry.file)
      if (!fileContent || !fileContent.content.includes(entry.value)) {
        staleEntries.push(
          `${entry.file}: '${entry.value}' no longer exists — remove this allowlist entry`,
        )
      }
    }

    if (staleEntries.length > 0) {
      assert.fail(
        `Stale breakpoint-allowlist entries (migrate done, entry not cleaned up):\n${staleEntries.map((s) => '  ' + s).join('\n')}`,
      )
    }
  })
})
