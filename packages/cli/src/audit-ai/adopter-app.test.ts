/**
 * The audit's structural guard: a realistic third-party app must audit clean.
 *
 * The docs recommend `"lint": "cascivo doctor --ci && cascivo audit --ai src"` as a CI gate.
 * On a correct router-based dashboard — one that typechecks against cascivo's own `.d.ts`,
 * passes `doctor`, and renders correctly — the audit exited 1 with six errors, every one of
 * them wrong. A team following the documented wiring got a red build on their first commit,
 * with errors contradicting the library's own types.
 *
 * The root cause of all six was the same: **the audit had never been run against correct
 * third-party code.** Unit tests covered each rule in isolation with a hand-built contract,
 * so nothing exercised the rules against the REAL bundled contract on realistic source.
 *
 * This test does exactly that, and it is the gate: the fixture under `__fixtures__/adopter-app`
 * is written the way the published docs teach, loaded through the same bundled contract a
 * consumer gets, and **must produce zero errors**.
 */
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildContract, type Contract } from '../utils/contract-pure.js'
import { findCssLiteralViolations } from './css-literals.js'
import { findJsxPropViolations } from './jsx-props.js'
import { findRequiredPropViolations } from './required-props.js'
import bundled from '../generated/audit-contract.json' with { type: 'json' }

const HERE = dirname(fileURLToPath(import.meta.url))
const APP = join(HERE, '__fixtures__', 'adopter-app')

/** The contract exactly as `loadContract`'s bundled tier builds it. */
function realContract(): Contract {
  const b = bundled as unknown as {
    tokens: { name: string; resolvedDefault: string | null }[]
    components: { name: string; props: { name: string; type: string; required: boolean }[] }[]
    content: string[]
  }
  return buildContract({
    catalog: { tokens: b.tokens },
    registry: { components: b.components.map((c) => ({ meta: c })) },
    context: { components: b.content.map((name) => ({ name, intent: { content: true } })) },
  })
}

interface Finding {
  file: string
  line: number
  rule: string
  level: string
  message?: string
}

function auditApp(): Finding[] {
  const contract = realContract()
  const findings: Finding[] = []
  for (const file of readdirSync(APP).filter((f) => f.endsWith('.tsx'))) {
    const source = readFileSync(join(APP, file), 'utf8')
    findings.push(
      ...findJsxPropViolations(source, file, contract),
      ...findRequiredPropViolations(source, file, contract),
      ...findCssLiteralViolations(source, file, contract),
    )
  }
  return findings
}

describe('cascivo audit --ai on a correct router-based dashboard', () => {
  it('reports zero errors', () => {
    const errors = auditApp().filter((f) => f.level === 'error')
    expect(
      errors.map((f) => `${f.file}:${f.line} ${f.rule} — ${f.message ?? ''}`),
      'the recommended CI gate must not fail a correct app',
    ).toEqual([])
  })

  // Each of the six reported false positives, pinned individually so a regression names
  // its own root cause instead of just "the fixture went red".

  it('does not call AppShell’s `nav` unknown (duplicate display names must not collapse)', () => {
    const bad = auditApp().filter((f) => f.rule === 'unknown-prop' && /"nav"/.test(f.message ?? ''))
    expect(
      bad,
      'two registry entries are named AppShell; the contract must merge, not overwrite',
    ).toEqual([])
  })

  it('does not demand `children` from a component that has element children', () => {
    const bad = auditApp().filter(
      (f) => f.rule === 'missing-prop' && /children/.test(f.message ?? ''),
    )
    expect(bad, 'children arrive as element content, not as an attribute').toEqual([])
  })

  it('does not demand `items` from a SideNav using `groups`', () => {
    const bad = auditApp().filter((f) => f.rule === 'missing-prop' && /items/.test(f.message ?? ''))
    expect(bad, 'SideNavProps says `items?`; the manifest must agree').toEqual([])
  })

  it('does not audit a third-party `Link` against cascivo’s contract', () => {
    const bad = auditApp().filter((f) => f.rule === 'unknown-prop' && /"to"/.test(f.message ?? ''))
    expect(bad, '`Link` imported from a router must not be matched by name').toEqual([])
  })

  it('does not suggest a spacing token for a DataTable column width', () => {
    const bad = auditApp().filter((f) => f.rule === 'hardcoded-value')
    expect(bad, 'a `width` in a data object is not a CSS declaration').toEqual([])
  })
})
