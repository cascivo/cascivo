import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  constName,
  genAutoFn,
  genContractRs,
  loadUnits,
  modName,
  pascal,
  type AutoTarget,
  type Unit,
} from './gen-contract.ts'

test('Rust names: modules, consts, variants', () => {
  assert.equal(modName('data-table'), 'data_table')
  assert.equal(modName('type'), 'r#type')
  assert.equal(constName('headerCell'), 'HEADER_CELL')
  assert.equal(constName('grid-container'), 'GRID_CONTAINER')
  assert.equal(pascal('in-progress'), 'InProgress')
  assert.equal(pascal('2xl'), 'V2xl')
})

test('contract_gen covers every contract and cascivo-html unit', () => {
  const units = loadUnits()
  const rs = genContractRs(units)
  for (const [unit, u] of Object.entries(units)) {
    assert.match(rs, new RegExp(`pub mod ${modName(unit).replace('#', '\\#')} \\{`))
    for (const cls of Object.values(u.classes)) assert.ok(rs.includes(`"${cls}"`), cls)
  }
  // Layout and chart units are not in contract.json but cascivo-html emits them.
  assert.ok(units['chart-legend'] && units['flex'])
  assert.match(
    rs,
    /pub mod button \{\n {4}\/\/\/ Root part\.\n {4}pub const ROOT: &str = "cv-button-button";/,
  )
  assert.match(rs, /pub enum Variant \{\n {8}Primary,/)
})

test('contract_gen rejects colliding const names', () => {
  const u: Unit = { alias: 'cv-x', classes: { 'a-b': 'cv-x-a-b', aB: 'cv-x-aB' } }
  assert.throws(() => genContractRs({ x: u }), /collides/)
})

const target = (props: AutoTarget['props'], children: AutoTarget['children'] = 'text') => ({
  cv: 'x',
  unit: 'x',
  children,
  props,
})

test('auto emitter: when, data from props, $text, void element', () => {
  const u: Unit = {
    alias: 'cv-x',
    classes: { x: 'cv-x-x', label: 'cv-x-label', img: 'cv-x-img' },
    anatomy: {
      root: {
        element: 'div',
        local: 'x',
        class: 'cv-x-x',
        data: { 'data-size': ['sm', 'md'], 'data-state': ['idle', 'open'] },
        aria: ['aria-hidden'],
        children: ['label', 'img', '$slot'],
      },
      parts: {
        label: {
          element: 'span',
          local: 'label',
          class: 'cv-x-label',
          children: ['$text'],
          when: 'label',
        },
        img: { element: 'img', local: 'img', class: 'cv-x-img', when: '!ghost' },
      },
    },
  }
  const rs = genAutoFn(
    target([
      { name: 'size', kind: 'Enum', default: 'md' },
      { name: 'open', kind: 'Bool' },
      { name: 'label', kind: 'Str' },
    ]),
    u,
    new Set(),
  )
  assert.match(
    rs,
    /attr\(out, "data-size", &node\.prop_str\("size"\)\.unwrap_or_else\(\|\| "md"\.into\(\)\)\);/,
  )
  assert.match(
    rs,
    /attr\(out, "data-state", if node\.prop_bool\("open"\) \{ "open" \} else \{ "idle" \}\);/,
  )
  assert.match(rs, /if node\.prop_str\("label"\)\.is_some_and/)
  // `ghost` is not a `.cv` prop: `!ghost` is constant true, so no condition.
  assert.doesNotMatch(rs, /ghost/)
  assert.doesNotMatch(rs, /<\/img>/)
  assert.match(rs, /attr\(out, "class", c::ROOT\);/)
})

test('auto emitter refuses what the anatomy cannot express', () => {
  const base = { local: 'x', class: 'cv-x-x' }
  const mk = (root: Unit['anatomy'] extends infer A ? NonNullable<A>['root'] : never): Unit => ({
    alias: 'cv-x',
    classes: { x: 'cv-x-x' },
    anatomy: { root },
  })
  const t = target([])
  assert.throws(
    () => genAutoFn(t, mk({ ...base, element: 'div', aria: ['aria-label'] }), new Set()),
    /manual/,
  )
  assert.throws(
    () => genAutoFn(t, mk({ ...base, element: 'div', children: ['@spinner'] }), new Set()),
    /embed/,
  )
  assert.throws(
    () => genAutoFn(t, mk({ ...base, element: 'div', when: 'a > 1' }), new Set()),
    /when/,
  )
  assert.throws(
    () => genAutoFn(t, mk({ ...base, element: ['hr', 'div'] }), new Set()),
    /polymorphic/,
  )
})
