import { describe, expect, it } from 'vitest'
import { A2uiPathError, getAt, parsePointer, resolvePath, setAt } from './pointer'

describe('resolvePath', () => {
  it('keeps absolute paths and scopes relative ones', () => {
    expect(resolvePath('/x', '/users/0')).toBe('/x')
    expect(resolvePath('name', '/users/0')).toBe('/users/0/name')
  })

  it('rejects a relative path outside a template scope', () => {
    expect(() => resolvePath('name', '')).toThrow(A2uiPathError)
  })
})

describe('parsePointer', () => {
  it('unescapes RFC 6901 tokens', () => {
    expect(parsePointer('/a~1b/c~0d')).toEqual(['a/b', 'c~d'])
  })

  it("treats '' and '/' as the root", () => {
    expect(parsePointer('')).toEqual([])
    expect(parsePointer('/')).toEqual([])
  })

  it.each(['/__proto__/x', '/constructor/prototype/y', '/a/__proto__', '/prototype'])(
    'rejects the dangerous segment in %s',
    (path) => {
      expect(() => parsePointer(path)).toThrow(A2uiPathError)
      expect(({} as Record<string, unknown>)['x']).toBeUndefined()
      expect(({} as Record<string, unknown>)['y']).toBeUndefined()
    },
  )
})

describe('getAt', () => {
  it('reads nested values and misses to undefined', () => {
    expect(getAt({ a: [{ b: 1 }] }, ['a', '0', 'b'])).toBe(1)
    expect(getAt({ a: 1 }, ['a', 'b'])).toBeUndefined()
    expect(getAt([1], ['01'])).toBeUndefined()
  })

  it('does not read inherited members', () => {
    expect(getAt({}, ['toString'])).toBeUndefined()
    expect(getAt([1], ['length'])).toBeUndefined()
  })
})

describe('setAt', () => {
  it('shares untouched branches', () => {
    const root = { a: { b: 1 }, c: {} }
    const next = setAt(root, ['a', 'b'], 2) as typeof root
    expect(next.a.b).toBe(2)
    expect(next.c).toBe(root.c)
    expect(root.a.b).toBe(1)
  })

  it('deleting an array slot keeps the length', () => {
    const next = setAt([1, 2], ['1'], undefined) as unknown[]
    expect(next).toEqual([1, undefined])
    expect(next).toHaveLength(2)
  })

  it('appends at length and rejects a gap', () => {
    expect(setAt([1], ['1'], 9)).toEqual([1, 9])
    expect(() => setAt([1], ['3'], 0)).toThrow(A2uiPathError)
    expect(() => setAt([1], ['x'], 0)).toThrow(A2uiPathError)
  })

  it('deletes an object key and ignores a missing path', () => {
    expect(setAt({ a: 1, b: 2 }, ['a'], undefined)).toEqual({ b: 2 })
    const root = { a: 1 }
    expect(setAt(root, ['x', 'y'], undefined)).toBe(root)
  })

  it('creates missing containers as plain objects', () => {
    const next = setAt(undefined, ['a', 'b'], 1)
    expect(next).toEqual({ a: { b: 1 } })
    expect(Object.getPrototypeOf((next as { a: unknown }).a)).toBe(Object.prototype)
  })

  it('replaces the root with no segments', () => {
    expect(setAt({ a: 1 }, [], { z: 1 })).toEqual({ z: 1 })
  })

  it('refuses dangerous segments given directly', () => {
    expect(() => setAt({}, ['__proto__', 'x'], 1)).toThrow(A2uiPathError)
  })
})
