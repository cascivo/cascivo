import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { describe, it } from 'node:test'

// G3: every static/native contract unit has a cascivo-html emitter, a parity case and a
// PARITY_COMPONENTS row, or an allowlist entry with a reason. The allowlist may only shrink.
const root = new URL('../../', import.meta.url)
const read = (p: string) => readFileSync(new URL(p, root), 'utf8')
const contract = JSON.parse(read('packages/css/contract.json')) as {
  units: Record<string, { tier: string }>
}
const dir = 'packages/components/test/html-conformance/'
const parity = new Set(
  [
    ...(read(`${dir}parity.ts`).split('PARITY_COMPONENTS = [')[1] ?? '')
      .split(']')[0]!
      .matchAll(/'([^']+)'/g),
  ].map((m) => m[1] as string),
)
const allow = (
  JSON.parse(read(`${dir}parity-coverage-allowlist.json`)) as { entries: Record<string, string> }
).entries
const emitters = new Set(
  [...read('crates/cascivo-html/src/catalog_gen.rs').matchAll(/component: "([^"]+)"/g)].map(
    (m) => m[1] as string,
  ),
)
const caseOf = (u: string) =>
  readdirSync(new URL(dir, root)).some((f) => f.startsWith(`${u}.`) && f.endsWith('.case.tsx'))
const covered = (u: string) => parity.has(u) && emitters.has(u) && caseOf(u)
const units = Object.entries(contract.units)
  .filter(([, u]) => u.tier !== 'behaviour')
  .map(([k]) => k)

describe('G3 parity coverage', () => {
  it('every static/native unit is covered or allowlisted', () => {
    const gaps = units.filter((u) => !covered(u) && !(u in allow))
    assert.deepEqual(
      gaps,
      [],
      'add an emitter + case + PARITY_COMPONENTS row, or an allowlist reason',
    )
  })
  it('allowlist entries are real, justified and still needed', () => {
    for (const [u, reason] of Object.entries(allow)) {
      assert.ok(units.includes(u), `${u} is not a static/native unit`)
      assert.ok(reason.trim().length > 20, `${u} needs a reason`)
      assert.ok(!covered(u), `${u} is covered now: remove it from the allowlist`)
    }
  })
})
