/**
 * Public-API contract for `@cascivo/storage`.
 *
 * `persistedSignal` and the synchronous drivers moved into `@cascivo/core` so the theme
 * runtime there could use them without a `core → storage → core` cycle. This package
 * re-exports them, and the whole point of doing it that way is that **nothing changes for
 * anyone importing `@cascivo/storage`**. This asserts that, because a re-export is exactly
 * the kind of change that looks free and silently drops a symbol.
 */
import { describe, expect, it } from 'vitest'
import * as storage from './index'

describe('@cascivo/storage public API', () => {
  it('still exports every symbol it exported before the move to @cascivo/core', () => {
    // The list is written out rather than snapshotted: a snapshot would happily record a
    // symbol going missing the moment someone ran with -u.
    expect(Object.keys(storage).sort()).toEqual([
      'indexedDBDriver',
      'localStorageDriver',
      'memoryDriver',
      'persistedSignal',
    ])
  })

  it('persistedSignal still round-trips through localStorage in the same envelope format', () => {
    // Format compatibility is the real risk of the move: an adopter's already-persisted
    // value must still load. `{ v, value }` is what shipped, so it is what must be read.
    localStorage.clear()
    const s = storage.persistedSignal<string>('storage-contract', 'light')
    expect(s.value).toBe('light')

    s.value = 'midnight'
    expect(JSON.parse(localStorage.getItem('storage-contract') ?? '{}')).toMatchObject({
      value: 'midnight',
    })

    // A value written by the pre-move implementation loads unchanged.
    localStorage.setItem('storage-contract-legacy', JSON.stringify({ v: 1, value: 'warm' }))
    expect(storage.persistedSignal<string>('storage-contract-legacy', 'light').value).toBe('warm')
  })

  it('memoryDriver and indexedDBDriver satisfy the same StorageDriver shape', () => {
    for (const driver of [storage.memoryDriver(), storage.indexedDBDriver()]) {
      expect(typeof driver.get).toBe('function')
      expect(typeof driver.set).toBe('function')
      expect(typeof driver.remove).toBe('function')
    }
  })
})
