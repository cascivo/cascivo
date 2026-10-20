import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseTsType, type TsType } from './ts-type.ts'

const str = (value: string): TsType => ({ kind: 'literal', value })
const num = (value: number): TsType => ({ kind: 'literal', value })
const prim = (name: 'string' | 'number' | 'boolean' | 'null' | 'undefined'): TsType => ({
  kind: 'primitive',
  name,
})
const ref = (name: string, args: TsType[] = []): TsType => ({ kind: 'ref', name, args })

describe('parseTsType', () => {
  it('parses a primitive', () => {
    assert.deepEqual(parseTsType('string'), prim('string'))
  })
  it('parses a string literal union', () => {
    assert.deepEqual(parseTsType("'sm' | 'md'"), {
      kind: 'union',
      members: [str('sm'), str('md')],
    })
  })
  it('parses a number literal union', () => {
    assert.deepEqual(parseTsType('1|2|3|4|5|6|8|10|12'), {
      kind: 'union',
      members: [1, 2, 3, 4, 5, 6, 8, 10, 12].map(num),
    })
  })
  it('keeps ReactNode a ref, not a literal', () => {
    assert.deepEqual(parseTsType('ReactNode'), ref('ReactNode'))
  })
  it('parses boolean | string literal', () => {
    assert.deepEqual(parseTsType("boolean | 'generating'"), {
      kind: 'union',
      members: [prim('boolean'), str('generating')],
    })
  })
  it('parses a dotted ref', () => {
    assert.deepEqual(parseTsType('React.ReactNode'), ref('React.ReactNode'))
  })
  it('parses generic ref arrays', () => {
    assert.deepEqual(parseTsType('Column<Row>[]'), {
      kind: 'array',
      element: ref('Column', [ref('Row')]),
    })
  })
  it('parses Array<T>', () => {
    assert.deepEqual(parseTsType('Array<string>'), { kind: 'array', element: prim('string') })
  })
  it('parses an array of inline objects', () => {
    assert.deepEqual(parseTsType('{ label: string; href?: string }[]'), {
      kind: 'array',
      element: {
        kind: 'object',
        fields: [
          { name: 'label', optional: false, type: prim('string') },
          { name: 'href', optional: true, type: prim('string') },
        ],
      },
    })
  })
  it('accepts comma separated fields', () => {
    assert.deepEqual(parseTsType('{ a: string, b?: number }'), {
      kind: 'object',
      fields: [
        { name: 'a', optional: false, type: prim('string') },
        { name: 'b', optional: true, type: prim('number') },
      ],
    })
  })
  it('parses an array of a parenthesised union of objects', () => {
    const t = parseTsType(
      "({ label: string; value: string; icon?: ReactNode; disabled?: boolean } | { kind: 'separator' })[]",
    )
    assert.deepEqual(t, {
      kind: 'array',
      element: {
        kind: 'union',
        members: [
          {
            kind: 'object',
            fields: [
              { name: 'label', optional: false, type: prim('string') },
              { name: 'value', optional: false, type: prim('string') },
              { name: 'icon', optional: true, type: ref('ReactNode') },
              { name: 'disabled', optional: true, type: prim('boolean') },
            ],
          },
          { kind: 'object', fields: [{ name: 'kind', optional: false, type: str('separator') }] },
        ],
      },
    })
  })
  it('parses number | object', () => {
    assert.deepEqual(parseTsType('number | { base?: number; sm?: number }'), {
      kind: 'union',
      members: [
        prim('number'),
        {
          kind: 'object',
          fields: [
            { name: 'base', optional: true, type: prim('number') },
            { name: 'sm', optional: true, type: prim('number') },
          ],
        },
      ],
    })
  })
  it('parses functions', () => {
    assert.deepEqual(parseTsType('(row: Row) => ReactNode'), { kind: 'function' })
    assert.deepEqual(parseTsType('() => void'), { kind: 'function' })
  })
  it('parses a function nested in a union', () => {
    assert.deepEqual(parseTsType('string | ((row: Row) => string)'), {
      kind: 'union',
      members: [prim('string'), { kind: 'function' }],
    })
  })
  it('parses event handler refs without classifying them', () => {
    assert.deepEqual(
      parseTsType('React.MouseEventHandler<HTMLButtonElement>'),
      ref('React.MouseEventHandler', [ref('HTMLButtonElement')]),
    )
  })
  it('parses unions with false and null', () => {
    assert.deepEqual(parseTsType('string | false'), {
      kind: 'union',
      members: [prim('string'), { kind: 'literal', value: false }],
    })
    assert.deepEqual(parseTsType('number | null'), {
      kind: 'union',
      members: [prim('number'), prim('null')],
    })
  })
  it('flattens nested unions', () => {
    assert.deepEqual(parseTsType("'a' | ('b' | 'c')"), {
      kind: 'union',
      members: [str('a'), str('b'), str('c')],
    })
  })
  it('returns null outside the supported subset', () => {
    assert.equal(parseTsType('[number, number]'), null)
    assert.equal(parseTsType('keyof T'), null)
    assert.equal(parseTsType('A & B'), null)
    assert.equal(parseTsType(''), null)
    assert.equal(parseTsType('string |'), null)
    assert.equal(parseTsType('{ a: string'), null)
  })
})
