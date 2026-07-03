/**
 * Claims check — hardcoded-count drift guard.
 *
 * Scans the marketing/docs claim surfaces (root README, readme.body.md files,
 * apps/site marketing + pages) for literal "<n> components / charts / themes"
 * claims and asserts each number matches the real count derived from
 * registry.json and packages/themes/src.
 *
 * Counts that intentionally describe a subset (not the whole library) are
 * allowlisted below with a reason. To claim a different global count, don't —
 * use the {{count.*}} placeholders (readme.body.md) or the injected
 * __CASCIVO_*_COUNT__ globals (apps/site) instead.
 */

import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname, relative } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')

// Keep in sync with NON_THEME_CSS in scripts/readme/generate.ts and
// apps/site/vite.config.ts.
const NON_THEME_CSS = new Set(['all.css', 'base.css', 'tailwind.css'])

// Subset counts that are correct as written. Key: `${file}:${match}`.
const ALLOWLIST: { file: string; match: string; reason: string }[] = [
  {
    file: 'apps/site/src/marketing/pages/accessibility/AccessibilityStatement.tsx',
    match: '12 components',
    reason: 'AT test-plan scope (12 components × 4 stacks), not the library count',
  },
  {
    file: 'apps/site/src/pages/WhyCascadePage.tsx',
    match: '72 components',
    reason: 'WCAG 2.2-AA verified subset from the a11y data, not the library count',
  },
]

function realCounts(): { components: number; charts: number; themes: number } {
  const registry = JSON.parse(readFileSync(join(REPO_ROOT, 'registry.json'), 'utf8')) as {
    components: { type?: string }[]
  }
  const themes = readdirSync(join(REPO_ROOT, 'packages/themes/src')).filter(
    (f) => f.endsWith('.css') && !NON_THEME_CSS.has(f),
  ).length
  return {
    components: registry.components.length,
    charts: registry.components.filter((c) => c.type === 'chart').length,
    themes,
  }
}

function collectFiles(dir: string, exts: Set<string>): string[] {
  const results: string[] = []
  try {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) results.push(...collectFiles(full, exts))
      else if (exts.has(extname(entry))) results.push(full)
    }
  } catch {
    // skip unreadable dirs
  }
  return results
}

function claimSurfaces(): string[] {
  const tsx = new Set(['.ts', '.tsx'])
  const files = [
    join(REPO_ROOT, 'README.md'),
    join(REPO_ROOT, 'readme.body.md'),
    ...collectFiles(join(REPO_ROOT, 'apps/site/src/marketing'), tsx),
    ...collectFiles(join(REPO_ROOT, 'apps/site/src/pages'), tsx),
  ]
  for (const dir of readdirSync(join(REPO_ROOT, 'packages'))) {
    const body = join(REPO_ROOT, 'packages', dir, 'readme.body.md')
    try {
      if (statSync(body).isFile()) files.push(body)
    } catch {
      // package has no readme.body.md
    }
  }
  return files
}

const CLAIM_RE = /(\d+)\+?\s+(?:first-party\s+)?(components|charts|themes)\b/gi

describe('claims:check — hardcoded counts match reality', () => {
  const counts = realCounts()
  const allowKeys = new Set(ALLOWLIST.map((e) => `${e.file}:${e.match.toLowerCase()}`))

  it('every literal count claim equals the real count or is allowlisted', () => {
    const violations: string[] = []

    for (const file of claimSurfaces()) {
      const rel = relative(REPO_ROOT, file)
      const source = readFileSync(file, 'utf8')
      const lines = source.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? ''
        let match: RegExpExecArray | null
        CLAIM_RE.lastIndex = 0
        while ((match = CLAIM_RE.exec(line)) !== null) {
          const n = Number(match[1])
          const noun = (match[2] ?? '').toLowerCase() as 'components' | 'charts' | 'themes'
          const expected = counts[noun]
          const key = `${rel}:${match[1]} ${noun}`
          if (n !== expected && !allowKeys.has(key)) {
            violations.push(
              `  ${rel}:${i + 1}  claims "${match[0]}" but real count is ${expected} — use {{count.${noun}}} / __CASCIVO_*_COUNT__ or allowlist with a reason`,
            )
          }
        }
      }
    }

    if (violations.length > 0) {
      assert.fail(`Stale hardcoded count claims found:\n${violations.join('\n')}`)
    }
  })

  it('allowlist has no stale entries', () => {
    const stale: string[] = []
    for (const entry of ALLOWLIST) {
      let content: string
      try {
        content = readFileSync(join(REPO_ROOT, entry.file), 'utf8')
      } catch {
        stale.push(`${entry.file}: file no longer exists — remove this allowlist entry`)
        continue
      }
      if (!content.toLowerCase().includes(entry.match.toLowerCase())) {
        stale.push(
          `${entry.file}: '${entry.match}' no longer present — remove this allowlist entry`,
        )
      }
    }
    if (stale.length > 0) {
      assert.fail(`Stale claims allowlist entries:\n${stale.map((s) => '  ' + s).join('\n')}`)
    }
  })
})
