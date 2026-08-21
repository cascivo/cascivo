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
// `light-dark.css` is a BUNDLE (light + dark), not a selectable theme — the same
// reason `all.css` is excluded. Counting it would claim 13 themes when 12 ship.
const NON_THEME_CSS = new Set(['all.css', 'light-dark.css', 'base.css', 'tailwind.css'])

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
  // Top-level hand-authored guides only — NOT docs/internal|plans|specs (historical
  // reports/plans quote point-in-time counts on purpose). Non-recursive by design.
  for (const entry of readdirSync(join(REPO_ROOT, 'docs'))) {
    if (extname(entry) !== '.md') continue
    files.push(join(REPO_ROOT, 'docs', entry))
  }
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

/**
 * SSR-claim consistency (2026-07-25 plan, WS-8 / mechanism C).
 *
 * The same fact — "does an SSR build need `ssr.noExternal`?" — was stated independently in
 * two places and drifted apart: `docs/USING-WITH-VITE-SSR.md` said SSR works with zero Vite
 * config as of `@cascivo/react` 0.10 (true; an adopter server-rendered 0.11.1 with an
 * untouched vite.config), while the `llms.txt` generator still told agents there were "two
 * required steps". `llms.txt` is the file an agent is most likely to fetch as its single
 * context source, so the stale copy was the one doing damage — new apps got dead config.
 *
 * A `noExternal` mention is fine; presenting it as unconditionally required is not. Every
 * mention in an agent-facing surface must be version-gated.
 */
describe('claims:check — the SSR requirement is stated consistently', () => {
  const AGENT_SURFACES = ['apps/site/public/llms.txt', 'docs/USING-WITH-VITE-SSR.md']

  /** Phrasings that present noExternal as required with no version qualifier nearby. */
  const IMPERATIVE = [
    /Two required steps/i,
    /you must add `?ssr\.noExternal/i,
    /supported, but add `?ssr\.noExternal/i,
  ]

  it('no agent-facing surface presents ssr.noExternal as unconditionally required', () => {
    const failures: string[] = []
    for (const rel of AGENT_SURFACES) {
      let content: string
      try {
        content = readFileSync(join(REPO_ROOT, rel), 'utf8')
      } catch {
        continue
      }
      for (const pattern of IMPERATIVE) {
        const m = pattern.exec(content)
        if (!m) continue
        // Scope the version gate to the ENCLOSING PARAGRAPH, not a byte window: a gate that
        // happens to sit a few hundred characters away in a different paragraph does not
        // qualify the instruction a reader is following here.
        const start = content.lastIndexOf('\n\n', m.index)
        const end = content.indexOf('\n\n', m.index)
        const paragraph = content.slice(start === -1 ? 0 : start, end === -1 ? content.length : end)
        if (/0\.10/.test(paragraph)) continue
        failures.push(`${rel}: "${m[0]}" presents ssr.noExternal as required with no version gate`)
      }
    }
    assert.deepEqual(
      failures,
      [],
      `SSR setup instructions must lead with the current truth (zero config on ` +
        `@cascivo/react >= 0.10) and gate the noExternal recipe to older versions:\n  ${failures.join('\n  ')}`,
    )
  })

  it('llms.txt states the zero-config SSR fact the guide states', () => {
    const txt = readFileSync(join(REPO_ROOT, 'apps/site/public/llms.txt'), 'utf8')
    assert.match(
      txt,
      /ZERO Vite config/i,
      'llms.txt must carry the zero-config SSR headline — it is the single-fetch context ' +
        'source for most agents, so it cannot be the surface that lags.',
    )
  })
})

/*
 * Measured-figure hygiene in the guides.
 *
 * `RECIPE-DASHBOARD.md` shipped a boxed warning ending "There is no third option today",
 * telling adopters to accept a ~525 kB entry chunk or drop charts from their landing page.
 * A third option existed the whole time — split the index route like every other route —
 * and a 2026-08-21 adopter measured 413.07 kB with sparklines still on the landing page.
 * They had already set `build.chunkSizeWarningLimit: 700` on the strength of the box, then
 * deleted it.
 *
 * A wrong doc is worse than a missing one, because it is trusted. Two rules follow, and this
 * guard is what makes them stick:
 *
 *  1. A bundle figure must be attributed to the measurement it came from, so a reader can
 *     tell a measured number from a remembered one and knows how stale it is.
 *  2. A guide may not close off the option space with an absolute. "There is no third
 *     option" was true of nobody's app and false of the reader's.
 */
describe('measured claims in the guides stay honest', () => {
  const MEASURED_DOCS = ['docs/RECIPE-DASHBOARD.md']
  // A kB/KB figure with a decimal point is a measurement someone took, not a round
  // rule-of-thumb like "roughly 540 KB" — those are prose and need no citation.
  const MEASURED_FIGURE = /\b\d+\.\d+\s*[kK]B\b/g
  const CITATION = /\b20\d\d-\d\d-\d\d report\b/

  for (const rel of MEASURED_DOCS) {
    it(`${rel} attributes every measured bundle figure to a dated report`, () => {
      const content = readFileSync(join(REPO_ROOT, rel), 'utf8')
      const failures: string[] = []
      for (const m of content.matchAll(MEASURED_FIGURE)) {
        // Scope to the enclosing paragraph, matching the ssr.noExternal guard above: the
        // citation must sit with the number a reader is looking at.
        const start = content.lastIndexOf('\n\n', m.index)
        const end = content.indexOf('\n\n', m.index)
        const paragraph = content.slice(start === -1 ? 0 : start, end === -1 ? content.length : end)
        if (CITATION.test(paragraph)) continue
        failures.push(`${rel}: "${m[0]}" has no dated report citation in its paragraph`)
      }
      assert.deepEqual(
        failures,
        [],
        'Every measured bundle figure must name the report it was measured in, so a reader ' +
          'can tell how old it is and reproduce it:\n  ' +
          failures.join('\n  '),
      )
    })

    it(`${rel} does not close off the option space with an absolute`, () => {
      const content = readFileSync(join(REPO_ROOT, rel), 'utf8')
      const ABSOLUTES = [
        /there is no (?:third|other|second) option/i,
        /there are only two options/i,
        /(?:this|that) is impossible today/i,
      ]
      const hits = ABSOLUTES.flatMap((p) => (p.exec(content) ? [p.exec(content)![0]] : []))
      assert.deepEqual(
        hits,
        [],
        `${rel} states an absolute about what is possible: "${hits.join('", "')}". The last ` +
          'one of these was false when it shipped and cost an adopter a config flag and a ' +
          '110 kB entry chunk. Describe what you measured, not what cannot exist.',
      )
    })
  }
})
