import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { layerOrderStatement } from '../build/layer-order.ts'
import { addRootAlias, buildDistCss } from './dist-css.ts'
import { CONTRACT_JSON, REPO_ROOT, type Contract } from './generate.ts'

const contract = JSON.parse(readFileSync(join(REPO_ROOT, CONTRACT_JSON), 'utf8')) as Contract
const dist = buildDistCss(contract)

test('addRootAlias widens every root selector to the alias, at the same specificity', () => {
  const css = '.cv-x-x{a:b}.cv-x-x:hover,.cv-x-xs .cv-x-x>i{c:d}.cv-x-x-y{e:f}.cv-x-xx{g:h}'
  assert.equal(
    addRootAlias(css, 'cv-x-x', 'cv-x'),
    ':is(.cv-x-x,.cv-x){a:b}:is(.cv-x-x,.cv-x):hover,.cv-x-xs :is(.cv-x-x,.cv-x)>i{c:d}' +
      '.cv-x-x-y{e:f}.cv-x-xx{g:h}',
  )
})

test('one sheet per unit with a CSS module, plus cascivo.css', () => {
  assert.ok(dist.has('cascivo.css'))
  assert.ok(dist.has('button.css'))
  for (const unit of Object.keys(contract.units))
    if (Object.keys(contract.units[unit]!.classes).length)
      assert.ok(dist.has(`${unit}.css`), `${unit}.css missing`)
})

test('every sheet opens with the canonical @layer order and keeps cascivo.component', () => {
  const order = layerOrderStatement()
  for (const [file, css] of dist) assert.ok(css.startsWith(order), `${file} lacks the order`)
  assert.match(dist.get('button.css')!, /@layer cascivo\.component\{/)
})

test('the button sheet carries contract classes and the cv-button root alias (owner Q1)', () => {
  const css = dist.get('button.css')!
  assert.match(css, /:is\(\.cv-button-button,\.cv-button\)/)
  assert.match(css, /\.cv-button-label/)
  assert.doesNotMatch(css, /\.cv-button-button(?![\w-]|,\.cv-button\))/)
})

test('cascivo.css holds every unit sheet once, after one order statement', () => {
  const all = dist.get('cascivo.css')!
  const order = layerOrderStatement()
  assert.equal(all.split(order).length - 1, 1)
  for (const [file, css] of dist)
    if (file !== 'cascivo.css') assert.ok(all.includes(css.slice(order.length)), file)
})

test('no root alias equals another unit class', () => {
  const owner = new Map<string, string>()
  for (const [unit, u] of Object.entries(contract.units))
    for (const cls of Object.values(u.classes)) owner.set(cls, unit)
  for (const [unit, u] of Object.entries(contract.units)) {
    const other = owner.get(u.alias)
    assert.ok(other === undefined || other === unit, `${u.alias} is also a class of ${other}`)
  }
})

test('deterministic', () => {
  assert.deepEqual([...buildDistCss(contract)], [...dist])
})
