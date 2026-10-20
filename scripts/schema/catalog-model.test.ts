import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { classifyProp, contextFor, parseDefault, toJsonSchema } from './catalog-model.ts'
import type { PropMeta, TypeDefMeta } from './catalog-model.ts'
import { parseTsType } from './ts-type.ts'

const prop = (name: string, type: string, extra: Partial<PropMeta> = {}): PropMeta => ({
  name,
  type,
  required: false,
  ...extra,
})

// Real DataTable `Column<Row>` shape, trimmed to the fields the assertions care about.
const columnDef: TypeDefMeta = {
  name: 'Column<Row>',
  description: 'A single column definition.',
  fields: [
    { name: 'key', type: 'string', required: true },
    { name: 'header', type: 'string', required: true },
    { name: 'sortable', type: 'boolean', required: false },
    { name: 'render', type: '(row: Row) => ReactNode', required: false },
  ],
}
const ctx = contextFor([columnDef])
const empty = contextFor(undefined)

describe('contextFor', () => {
  it('keys typedefs by exact and bare name and collects generic params', () => {
    assert.equal(ctx.typeDefs.get('Column<Row>'), columnDef)
    assert.equal(ctx.typeDefs.get('Column'), columnDef)
    assert.deepEqual([...ctx.typeParams], ['Row'])
  })
})

describe('classifyProp', () => {
  it('maps a string enum to data with its parsed default', () => {
    const c = classifyProp(
      prop('variant', "'primary' | 'secondary'", { default: 'primary' }),
      empty,
    )
    assert.deepEqual(c, {
      kind: 'data',
      schema: { type: 'string', enum: ['primary', 'secondary'] },
      default: 'primary',
    })
  })
  it('carries the description and drops an invalid default', () => {
    const c = classifyProp(prop('ratio', 'number', { default: '16 / 9', description: 'd' }), empty)
    assert.deepEqual(c, { kind: 'data', schema: { type: 'number' }, description: 'd' })
  })
  it('classifies slots', () => {
    assert.deepEqual(classifyProp(prop('children', 'ReactNode'), empty), {
      kind: 'slot',
      arity: 'many',
    })
    assert.deepEqual(classifyProp(prop('icon', 'ReactNode'), empty), { kind: 'slot', arity: 'one' })
    assert.deepEqual(classifyProp(prop('brand', 'ShellHeaderBrand | ReactNode'), empty), {
      kind: 'slot',
      arity: 'one',
    })
    assert.deepEqual(classifyProp(prop('el', 'React.ReactElement'), empty), {
      kind: 'slot',
      arity: 'one',
    })
  })
  it('classifies events and omits other functions', () => {
    assert.deepEqual(
      classifyProp(prop('onClick', 'React.MouseEventHandler<HTMLButtonElement>'), empty),
      { kind: 'event' },
    )
    assert.deepEqual(classifyProp(prop('onValueChange', '(value: string) => void'), empty), {
      kind: 'event',
    })
    assert.deepEqual(classifyProp(prop('getRowId', '(row: Row) => string'), ctx), {
      kind: 'omitted',
      reason: 'function',
    })
  })
  it('classifies an optional function-typed handler as an event', () => {
    assert.deepEqual(classifyProp(prop('onClose', '(() => void) | undefined'), empty), {
      kind: 'event',
    })
  })
  it('omits unparseable types', () => {
    assert.deepEqual(classifyProp(prop('pair', '[string, number]'), empty), {
      kind: 'omitted',
      reason: 'unparseable',
    })
  })
  it('resolves DataTable columns through the Column<Row> typedef', () => {
    const c = classifyProp(prop('columns', 'Column<Row>[]', { required: true }), ctx)
    assert.deepEqual(c, {
      kind: 'data',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          description: 'A single column definition.',
          properties: {
            key: { type: 'string' },
            header: { type: 'string' },
            sortable: { type: 'boolean' },
          },
          required: ['key', 'header'],
          additionalProperties: false,
        },
      },
    })
  })
  it('maps a generic row array to an open object array', () => {
    const c = classifyProp(prop('rows', 'Row[]'), ctx)
    assert.deepEqual(c, { kind: 'data', schema: { type: 'array', items: { type: 'object' } } })
  })
  it('omits refs with no typedef', () => {
    assert.deepEqual(classifyProp(prop('labels', 'PaginationLabels'), ctx), {
      kind: 'omitted',
      reason: 'unresolved-type',
    })
  })
  it('omits any and unknown as unresolved', () => {
    assert.deepEqual(classifyProp(prop('x', 'any'), empty), {
      kind: 'omitted',
      reason: 'unresolved-type',
    })
    assert.deepEqual(classifyProp(prop('y', 'unknown'), empty), {
      kind: 'omitted',
      reason: 'unresolved-type',
    })
  })
  it('omits a prop whose typedef has a required function field', () => {
    const c = contextFor([
      {
        name: 'RowAction<Row>',
        fields: [{ name: 'onSelect', type: '(row: Row) => void', required: true }],
      },
    ])
    assert.deepEqual(classifyProp(prop('actions', 'RowAction<Row>[]'), c), {
      kind: 'omitted',
      reason: 'unresolved-type',
    })
  })
  it('does not loop on self-referencing typedefs', () => {
    const c = contextFor([
      { name: 'Node', fields: [{ name: 'child', type: 'Node', required: true }] },
    ])
    assert.deepEqual(classifyProp(prop('tree', 'Node'), c), {
      kind: 'omitted',
      reason: 'unresolved-type',
    })
  })
})

describe('toJsonSchema', () => {
  const to = (src: string, inData = true) => {
    const t = parseTsType(src)
    assert.ok(t)
    return toJsonSchema(t, empty, inData)
  }
  it('maps primitives, dropping undefined from unions', () => {
    assert.deepEqual(to('string'), { type: 'string' })
    assert.deepEqual(to('string | undefined'), { type: 'string' })
  })
  it('maps literal unions', () => {
    assert.deepEqual(to('1 | 2'), { type: 'number', enum: [1, 2] })
    assert.deepEqual(to('true | false'), { type: 'boolean' })
  })
  it('groups mixed unions into anyOf', () => {
    assert.deepEqual(to("'a' | 'b' | number"), {
      anyOf: [{ type: 'string', enum: ['a', 'b'] }, { type: 'number' }],
    })
  })
  it('maps inline objects', () => {
    assert.deepEqual(to('{ a: string; b?: number; c?: () => void }'), {
      type: 'object',
      properties: { a: { type: 'string' }, b: { type: 'number' } },
      required: ['a'],
      additionalProperties: false,
    })
    assert.equal(to('{ a: () => void }'), null)
  })
  it('maps x | null to anyOf with a null branch', () => {
    assert.deepEqual(to('string | null'), { anyOf: [{ type: 'string' }, { type: 'null' }] })
  })
  it('maps ReactNode to string only in data', () => {
    assert.deepEqual(to('ReactNode', true), { type: 'string' })
    assert.equal(to('ReactNode', false), null)
  })
})

const to2 = (src: string) => {
  const t = parseTsType(src)
  assert.ok(t)
  const s = toJsonSchema(t, empty, true)
  assert.ok(s)
  return s
}

describe('parseDefault', () => {
  const enumSchema = { type: 'string', enum: ['sm', 'md'] }
  it('parses strings bare or quoted', () => {
    assert.deepEqual(parseDefault('md', enumSchema), { value: 'md' })
    assert.deepEqual(parseDefault("'md'", enumSchema), { value: 'md' })
    assert.equal(parseDefault('huge', enumSchema), undefined)
  })
  it('parses booleans and numbers', () => {
    assert.deepEqual(parseDefault('false', { type: 'boolean' }), { value: false })
    assert.equal(parseDefault('yes', { type: 'boolean' }), undefined)
    assert.deepEqual(parseDefault('3', { type: 'number' }), { value: 3 })
    assert.equal(parseDefault('16 / 9', { type: 'number' }), undefined)
  })
  it('parses defaults on anyOf schemas, trying plain strings last', () => {
    const ai = to2("boolean | 'generating'")
    assert.deepEqual(parseDefault('false', ai), { value: false })
    assert.deepEqual(parseDefault('generating', ai), { value: 'generating' })
    const cols = to2('number | { a: string }')
    assert.deepEqual(parseDefault('12', cols), { value: 12 })
    const href = to2('string | false')
    assert.deepEqual(parseDefault("'#cascade-main'", href), { value: '#cascade-main' })
    assert.deepEqual(parseDefault('false', href), { value: false })
    const fb = to2("'good' | 'bad' | null")
    assert.deepEqual(parseDefault('null', fb), { value: null })
    assert.equal(parseDefault('huge', fb), undefined)
  })
  it('parses JSON for arrays and objects', () => {
    assert.deepEqual(parseDefault('[]', { type: 'array' }), { value: [] })
    assert.deepEqual(parseDefault('{"a":1}', { type: 'object' }), { value: { a: 1 } })
    assert.equal(parseDefault('{}', { type: 'array' }), undefined)
    assert.equal(parseDefault('nope', { type: 'array' }), undefined)
  })
})
