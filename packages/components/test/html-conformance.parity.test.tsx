import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { diff, PARITY_COMPONENTS, type Drift } from './html-conformance/parity.ts'
import allowlist from './html-conformance/parity-allowlist.json' with { type: 'json' }

// W1 parity gate: for ten shared components, every React SSR fixture is diffed against the
// committed cascivo-html snapshot (itself kept honest by `cargo test`). Differences are
// reported per facet (element tree, role, aria-*, data-*, class contract, other attrs) and
// fail unless justified in parity-allowlist.json.
const cases = import.meta.glob<{ default: ReactElement }>('./html-conformance/*.case.tsx', {
  eager: true,
})
const dir = fileURLToPath(
  new URL('../../../crates/cascivo-html/tests/conformance/', import.meta.url),
)
const allowed = new Map(Object.entries(allowlist.entries as Record<string, string>))
const componentOf = (name: string) => name.split('.')[0] as string

const used = new Set<string>()
const report = new Map<string, { cases: number; raw: number; unjustified: number }>()

describe('React vs cascivo-html parity (parity components)', () => {
  for (const c of PARITY_COMPONENTS) {
    describe(c, () => {
      for (const [path, mod] of Object.entries(cases)) {
        const name = path.replace(/^.*\//, '').replace(/\.case\.tsx$/, '')
        if (componentOf(name) !== c) continue
        it(name, () => {
          const rust = readFileSync(`${dir}${name}.html`, 'utf8')
          const drift: Drift[] = diff(renderToStaticMarkup(mod.default), rust)
          const row = report.get(c) ?? { cases: 0, raw: 0, unjustified: 0 }
          row.cases += 1
          row.raw += drift.length
          const bad = drift.filter((d) => {
            // exact fact, or `<case>|<facet>|*` for a structural difference that is by design
            const hit = [`${name}|${d.facet}|${d.key}`, `${name}|${d.facet}|*`].find((k) =>
              allowed.has(k),
            )
            if (hit) used.add(hit)
            return !hit
          })
          row.unjustified += bad.length
          report.set(c, row)
          expect(bad.map((d) => `${d.side} ${d.facet} ${d.key}`)).toEqual([])
        })
      }
    })
  }

  it('detects injected drift in role, aria, data and class', () => {
    const base = '<div role="status" data-variant="default" class="cv-alert-alert"><p>x</p></div>'
    const drifted =
      '<div role="alert" aria-live="polite" data-variant="info" class="cv-alert-box"><p>x</p></div>'
    const facets = new Set(diff(drifted, base).map((d) => d.facet))
    expect([...facets].sort()).toEqual(['aria', 'class', 'data', 'role'])
    // Rust's cv-<unit>- prefix is stripped, React's non-scoped names are already bare
    expect(
      diff('<div class="alert"><p>x</p></div>', '<div class="cv-alert-alert"><p>x</p></div>'),
    ).toEqual([])
  })

  it('every allowlist entry is still needed, has a reason, and names a parity case', () => {
    for (const [k, reason] of allowed) {
      expect(reason.trim().length, k).toBeGreaterThan(10)
      expect(used.has(k), `stale allowlist entry ${k}`).toBe(true)
    }
  })

  it('every parity component has at least one case', () => {
    for (const c of PARITY_COMPONENTS) expect(report.get(c)?.cases ?? 0, c).toBeGreaterThan(0)
    if (process.env['PARITY_REPORT']) {
      writeFileSync(process.env['PARITY_REPORT'], JSON.stringify([...report], null, 1))
    }
  })
})
