import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CV_SPEC } from './cv-spec.ts'
import { generateAll, propKind, summarize, HEADER } from './gen-rust.ts'

const out = await generateAll()
const catalog = out.get('src/catalog_gen.rs')!
const css = out.get('src/css_gen.rs')!

test('header marks files as generated', () => {
  assert.ok(catalog.startsWith(HEADER))
  assert.ok(css.startsWith(HEADER))
})

test('catalog has card and button enum', () => {
  assert.ok(catalog.includes('name: "card"'))
  assert.ok(catalog.includes('Enum(&["primary",'))
})

test('every cv name is present and the catalog is sorted by cv name', () => {
  const names = [...catalog.matchAll(/^ {8}name: "([^"]+)"/gm)].map((m) => m[1]!)
  assert.equal(names.length, CV_SPEC.length)
  assert.deepEqual(names, [...names].sort())
  assert.ok(names.includes('table') && names.includes('bar'))
})

test('manifest defaults surface as default: Some(..)', async () => {
  const { meta } = (await import('../../packages/components/src/button/button.meta.ts')) as {
    meta: { props: { name: string; default?: string }[] }
  }
  for (const p of meta.props)
    if (p.default !== undefined && !['asChild'].includes(p.name))
      assert.ok(
        catalog.includes(`name: "${p.name}"`) &&
          catalog.includes(`Some("${p.default.replace(/^'|'$/g, '')}")`),
        p.name,
      )
})

test('propKind mapping', () => {
  assert.deepEqual(propKind("'a' | 'b'"), { t: 'Enum', values: ['a', 'b'] })
  assert.deepEqual(propKind('1|2|3'), { t: 'Enum', values: ['1', '2', '3'] })
  assert.deepEqual(propKind('boolean'), { t: 'Bool' })
  assert.deepEqual(propKind('number'), { t: 'Num' })
  assert.deepEqual(propKind('ReactNode'), { t: 'Str' })
  assert.equal(propKind('(v: string) => void'), null)
  assert.equal(propKind('Foo<Bar>[]'), null)
})

test('summary is the first sentence, <= 80 chars', () => {
  assert.equal(summarize('A `thing` (e.g. big). More text.'), 'A thing (e.g big)')
  assert.ok(summarize('x'.repeat(200)).length <= 80)
})

test('css_gen embeds every unit, base and 12 themes', () => {
  assert.ok(css.includes('pub static COMPONENT_CSS'))
  assert.ok(css.includes('include_str!("../assets/css/card.css")'))
  assert.ok(css.includes('pub static BASE_CSS'))
  assert.equal((css.match(/assets\/themes\//g) ?? []).length, 12)
})

test('byte-identical on two runs', async () => {
  assert.deepEqual([...(await generateAll())], [...out])
})
