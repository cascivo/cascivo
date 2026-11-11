import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildAll, buildCss, moduleFiles } from './build-css.ts'
import { CV_SPEC } from './cv-spec.ts'

test('v1 has 52 components', () => assert.equal(CV_SPEC.length, 52))

test('cv names and aliases are unique', () => {
  const all = CV_SPEC.flatMap((e) => [e.cv, ...e.aliases])
  assert.equal(new Set(all).size, all.length)
})

test('every css unit resolves to a CSS module', () => {
  for (const unit of new Set(CV_SPEC.flatMap((e) => e.css)))
    assert.ok(moduleFiles(unit).length > 0, `no *.module.css for ${unit}`)
})

test('every component dir exists', () => {
  for (const e of CV_SPEC)
    for (const u of e.css.length ? [e.css[0]!] : [])
      assert.ok(u === 'chart-legend' || moduleFiles(u).length > 0, e.component)
})

test('buildCss(card) has fixed names, layer, no imports or hashed names', () => {
  const css = buildCss('card')
  assert.ok(css.includes('.cv-card-card'))
  assert.ok(css.includes('@layer cascivo.component'))
  assert.ok(!css.includes('@import'))
  assert.ok(!/_card_/.test(css))
})

test('keyframe names stay global', () => {
  assert.ok(!/cv-spinner-cascivo/.test(buildCss('spinner')))
})

test('deterministic', () => {
  assert.deepEqual([...buildAll()], [...buildAll()])
})

test('base and themes are produced', () => {
  const all = buildAll()
  assert.ok(all.get('assets/css/base.css')!.includes('cascivo.component'))
  assert.equal([...all.keys()].filter((k) => k.startsWith('assets/themes/')).length, 12)
})
