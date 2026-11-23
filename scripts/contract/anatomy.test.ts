import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Anatomy, ComponentMeta } from '../../packages/core/src/types.ts'
import { resolveAnatomy, validateAnatomy } from './anatomy.ts'

type M = Pick<ComponentMeta, 'variants' | 'sizes' | 'states' | 'contractTier' | 'anatomy'>
const meta = (anatomy: Anatomy, o: Partial<M> = {}): M => ({
  variants: ['primary', 'ghost'],
  sizes: [],
  states: ['idle', 'loading'],
  contractTier: 'static',
  anatomy,
  ...o,
})
const LOCALS = ['button', 'label', 'icon']
const ok: Anatomy = {
  root: {
    element: ['a', 'button'],
    data: { 'data-variant': ['primary', 'ghost'], 'data-state': ['idle', 'loading'] },
    aria: ['aria-busy'],
    children: ['icon', 'label'],
  },
  parts: {
    icon: { element: 'span', when: 'icon' },
    label: { element: 'span', children: ['$slot'] },
  },
}
const errs = (m: M, locals = LOCALS) => validateAnatomy('button', m, locals)

test('a complete anatomy passes', () => assert.deepEqual(errs(meta(ok)), []))

test('no anatomy, valid tier: passes', () =>
  assert.deepEqual(errs({ ...meta(ok), anatomy: undefined }), []))

test('missing or unknown contractTier fails', () => {
  assert.match(errs(meta(ok, { contractTier: undefined })).join(), /contractTier/)
  assert.match(errs(meta(ok, { contractTier: 'x' as never })).join(), /contractTier/)
})

test('root local defaults to the unit; otherwise must be given', () => {
  assert.match(validateAnatomy('data-table', meta(ok), ['root']).join(), /root.*local/)
})

test('every part local is a CSS class, and every CSS class is a part', () => {
  assert.match(errs(meta(ok), [...LOCALS, 'extra']).join(), /extra.*not a part/)
  assert.match(errs(meta(ok), ['button', 'label']).join(), /icon.*not a CSS-module class/)
})

test('element must be a tag name', () => {
  const a = { ...ok, root: { ...ok.root, element: 'Button' } }
  assert.match(errs(meta(a)).join(), /element/)
  assert.match(errs(meta({ ...ok, root: { ...ok.root, element: [] } })).join(), /element/)
})

test('data and aria names are checked', () => {
  const a = { ...ok, root: { ...ok.root, data: { variant: ['primary'] }, aria: ['busy'] } }
  const e = errs(meta(a)).join()
  assert.match(e, /data attribute "variant"/)
  assert.match(e, /aria attribute "busy"/)
})

test('data-variant / data-size / data-state must agree with the meta', () => {
  const a = { ...ok, root: { ...ok.root, data: { 'data-variant': ['primary'] } } }
  assert.match(errs(meta(a)).join(), /data-variant.*variants/)
  const b = { ...ok, root: { ...ok.root, data: { 'data-state': ['idle', 'open'] } } }
  assert.match(errs(meta(b)).join(), /data-state.*states/)
  // Inner parts carry their own values.
  const c = {
    ...ok,
    parts: { ...ok.parts, label: { element: 'span', data: { 'data-state': ['open'] } } },
  }
  assert.deepEqual(errs(meta(c)), [])
})

test('modifier classes sit on a part and count as used', () => {
  const a = { ...ok, root: { ...ok.root, modifiers: { extra: 'compact' } } }
  assert.deepEqual(errs(meta(a), [...LOCALS, 'extra']), [])
  assert.match(errs(meta(a)).join(), /modifier "extra" is not a CSS-module class/)
  const r = resolveAnatomy('button', a)
  assert.deepEqual(r.root.modifiers, { extra: { class: 'cv-button-extra', when: 'compact' } })
})

test('children: unknown refs, unreachable parts, cycles, root as child', () => {
  const unknown = { ...ok, root: { ...ok.root, children: ['icon', 'label', 'nope'] } }
  assert.match(errs(meta(unknown)).join(), /unknown child "nope"/)
  const orphan = { ...ok, root: { ...ok.root, children: ['label'] } }
  assert.match(errs(meta(orphan)).join(), /"icon" is not reachable/)
  const cycle: Anatomy = {
    root: { element: 'button', children: ['icon'] },
    parts: {
      icon: { element: 'span', children: ['label'] },
      label: { element: 'span', children: ['icon'] },
    },
  }
  assert.match(errs(meta(cycle)).join(), /cycle/)
  const embed = { ...ok, root: { ...ok.root, children: ['@spinner', 'icon', 'label'] } }
  assert.deepEqual(errs(meta(embed)), [])
  const badEmbed = { ...ok, root: { ...ok.root, children: ['@Spin', 'icon', 'label'] } }
  assert.match(errs(meta(badEmbed)).join(), /@<unit>/)
  const self = { ...ok, root: { ...ok.root, children: ['root', 'icon', 'label'] } }
  assert.match(errs(meta(self)).join(), /root/)
})

test("emit is only for 'static' / 'native' tiers", () => {
  const a = { ...ok, root: { ...ok.root, emit: 'auto' as const } }
  assert.deepEqual(errs(meta(a)), [])
  assert.match(errs(meta(a, { contractTier: 'behaviour' })).join(), /emit/)
})

test('two parts may not share a local', () => {
  const a = { ...ok, parts: { ...ok.parts, icon: { element: 'span', local: 'label' } } }
  assert.match(errs(meta(a)).join(), /share/)
})

test('resolveAnatomy fills locals and classes', () => {
  const r = resolveAnatomy('button', ok)
  assert.equal(r.root.class, 'cv-button-button')
  assert.equal(r.parts['label']!.class, 'cv-button-label')
  assert.deepEqual(r.root.element, ['a', 'button'])
})
