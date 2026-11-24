import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  buildContract,
  CLASSES_TS,
  CONTRACT_JSON,
  generateAll,
  loadUnits,
  REPO_ROOT,
  renderClasses,
} from './generate.ts'
import { ANATOMY_ALLOWLIST } from './anatomy-allowlist.ts'

const units = await loadUnits()
const generated = await generateAll()

/**
 * Components that carry anatomy from WS-0 on: the ten Phase-0 parity components, plus what
 * Phase 3 needs first (`rust-html-stack-plan.md` "Phase 1 and 3 plans: how they fit").
 * `dialog` is `modal`, `table` is `data-table`. The list may only grow.
 */
const ANATOMY_REQUIRED = [
  'alert',
  'avatar',
  'badge',
  'breadcrumb',
  'button',
  'card',
  'checkbox',
  'data-table',
  'field',
  'input',
  'modal',
  'progress',
  'select',
  'separator',
  'stat',
  'tabs',
  'toast',
]

test('finds every component manifest (guards against a silent skip)', () => {
  assert.equal(units.length, 146)
})

test('every component manifest declares a valid contractTier and anatomy (generator throws)', () => {
  assert.doesNotThrow(() => buildContract(units))
})

test('anatomy exists for the WS-0 components', () => {
  const missing = ANATOMY_REQUIRED.filter((u) => !units.find((x) => x.unit === u)?.meta.anatomy)
  assert.deepEqual(missing, [])
})

test('committed contract.json and classes.gen.ts are fresh (run `pnpm contract:generate`)', () => {
  for (const rel of [CONTRACT_JSON, CLASSES_TS])
    assert.equal(readFileSync(join(REPO_ROOT, rel), 'utf8'), generated.get(rel), rel)
})

test('deterministic', async () => {
  assert.deepEqual([...(await generateAll())], [...generated])
})

test('button contract: classes, alias, anatomy root', () => {
  const c = buildContract(units)
  const b = c.units['button']!
  assert.equal(b.alias, 'cv-button')
  assert.equal(b.tier, 'static')
  assert.deepEqual(b.classes, { button: 'cv-button-button', label: 'cv-button-label' })
  assert.equal(b.anatomy?.root.class, 'cv-button-button')
})

test('classes.gen.ts: camelCase unit keys, root + alias, quoted non-identifiers', () => {
  const src = renderClasses({
    $comment: '',
    format: 1,
    units: {
      'data-table': {
        name: 'DataTable',
        tier: 'behaviour',
        alias: 'cv-data-table',
        classes: { root: 'cv-data-table-root', 'sr-only': 'cv-data-table-sr-only' },
      },
    },
  })
  assert.match(
    src,
    /dataTable: \{\n {4}root: 'cv-data-table-root',\n {4}alias: 'cv-data-table',\n {4}'sr-only'/,
  )
  assert.doesNotMatch(src, /root: 'cv-data-table-root',\n.*\n {4}root:/)
})

test('a local named `alias` is refused', () => {
  assert.throws(
    () =>
      renderClasses({
        $comment: '',
        format: 1,
        units: {
          x: { name: 'X', tier: 'static', alias: 'cv-x', classes: { alias: 'cv-x-alias' } },
        },
      }),
    /alias/,
  )
})

test('G2: every component with a CSS module has anatomy (or is allowlisted)', () => {
  const allow = new Set(ANATOMY_ALLOWLIST)
  const missing = units.filter((u) => u.modules.length && !u.meta.anatomy && !allow.has(u.unit))
  assert.deepEqual(
    missing.map((u) => u.unit),
    [],
  )
})

test('G2 allowlist only shrinks: no entry already has anatomy, no unknown or duplicate entry', () => {
  const byUnit = new Map(units.map((u) => [u.unit, u]))
  assert.equal(new Set(ANATOMY_ALLOWLIST).size, ANATOMY_ALLOWLIST.length)
  const stale = ANATOMY_ALLOWLIST.filter((n) => {
    const u = byUnit.get(n)
    return !u || !u.modules.length || u.meta.anatomy
  })
  assert.deepEqual(stale, [])
})
