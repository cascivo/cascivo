import { effect } from '@cascivo/core'
import { describe, expect, it } from 'vitest'
import { A2uiDataError, createDataModel } from './data-model'
import { A2uiPathError } from './pointer'

describe('createDataModel', () => {
  it('reads and writes by absolute path', () => {
    const m = createDataModel({ a: { b: 1 } })
    expect(m.read('/a/b').value).toBe(1)
    m.write('/a/b', 3)
    expect(m.read('/a/b').value).toBe(3)
    expect(m.snapshot()).toEqual({ a: { b: 3 } })
  })

  it('returns the same signal for the same path', () => {
    const m = createDataModel({})
    expect(m.read('/a')).toBe(m.read('/a'))
  })

  it('rejects a relative read', () => {
    expect(() => createDataModel({}).read('a')).toThrow(A2uiPathError)
  })

  it('notifies only subscribers whose value changed', () => {
    const m = createDataModel({ a: { b: 1 }, c: 0 })
    const sig = m.read('/a/b')
    let runs = 0
    const stop = effect(() => {
      void sig.value
      runs++
    })
    expect(runs).toBe(1)
    m.write('/c', 1)
    expect(runs).toBe(1)
    m.write('/a/b', 3)
    expect(runs).toBe(2)
    stop()
  })

  it("replaces the model at '/' and ''", () => {
    const m = createDataModel({ a: 1 })
    m.write('/', { z: 1 })
    expect(m.snapshot()).toEqual({ z: 1 })
    m.write('', { y: 1 })
    expect(m.root.value).toEqual({ y: 1 })
  })

  it('treats null as a delete', () => {
    const m = createDataModel({ a: 1, b: 2 })
    m.write('/a', null)
    expect(m.snapshot()).toEqual({ b: 2 })
    m.write('/b', undefined)
    expect(m.snapshot()).toEqual({})
  })

  it('cannot be polluted through the prototype', () => {
    const m = createDataModel({})
    for (const p of ['/__proto__/x', '/constructor/prototype/y', '/a/__proto__']) {
      expect(() => m.write(p, 1)).toThrow(A2uiPathError)
    }
    expect(({} as Record<string, unknown>)['x']).toBeUndefined()
    expect(({} as Record<string, unknown>)['y']).toBeUndefined()
    expect(m.snapshot()).toEqual({})
  })

  it('does not mutate the initial value', () => {
    const initial = { a: 1 }
    createDataModel(initial).write('/a', 2)
    expect(initial.a).toBe(1)
  })

  it('enforces the node limit', () => {
    const m = createDataModel({})
    const big = Array.from({ length: 10_001 }, () => 1)
    expect(() => m.write('/big', big)).toThrow(A2uiDataError)
    expect(() => m.write('/ok', big.slice(0, 9_000))).not.toThrow()
    const small = createDataModel({}, { maxNodes: 2 })
    expect(() => small.write('/a', { x: 1, y: 2 })).toThrow(A2uiDataError)
    expect(() => small.write('/a', { x: 1, y: 2 })).toThrow('At most 2 JSON nodes per value.')
    try {
      small.write('/a', { x: 1, y: 2 })
    } catch (e) {
      expect(e instanceof A2uiDataError && e.code).toBe('LIMIT_EXCEEDED')
    }
  })

  it('refuses a non-object root and snapshots an empty model as {}', () => {
    const m = createDataModel()
    expect(m.snapshot()).toEqual({})
    for (const value of [5, 'x', [1], false]) {
      expect(() => m.write('/', value)).toThrow(A2uiDataError)
    }
    m.write('/', { a: 1 })
    m.write('', undefined)
    expect(m.snapshot()).toEqual({})
  })
})
