import { beforeEach, describe, expect, it, vi } from 'vitest'
import { memoryDriver, type StorageDriver } from './drivers'
import { persistedSignal } from './persisted-signal'

beforeEach(() => {
  localStorage.clear()
})

describe('persistedSignal (sync driver)', () => {
  it('starts with initial when storage is empty, ready immediately', () => {
    const theme = persistedSignal('t1', 'light')
    expect(theme.value).toBe('light')
    expect(theme.ready.value).toBe(true)
  })

  it('hydrates from storage', () => {
    localStorage.setItem('t2', JSON.stringify({ v: 1, value: 'dark' }))
    expect(persistedSignal('t2', 'light').value).toBe('dark')
  })

  it('writes through on change', () => {
    // explicit <string>: otherwise T infers as the literal type 'light'
    const theme = persistedSignal<string>('t3', 'light')
    theme.value = 'warm'
    expect(JSON.parse(localStorage.getItem('t3') ?? '')).toEqual({ v: 1, value: 'warm' })
  })

  it('falls back to initial on corrupt data', () => {
    localStorage.setItem('t4', 'not-json{')
    expect(persistedSignal('t4', 'light').value).toBe('light')
  })

  it('migrates old versions and persists the result', () => {
    localStorage.setItem('t5', JSON.stringify({ v: 1, value: 'blue' }))
    const sig = persistedSignal('t5', 'fallback', {
      version: 2,
      migrate: (old) => `${String(old)}-migrated`,
    })
    expect(sig.value).toBe('blue-migrated')
    expect(JSON.parse(localStorage.getItem('t5') ?? '')).toEqual({ v: 2, value: 'blue-migrated' })
  })

  it('updates from cross-tab storage events', () => {
    const sig = persistedSignal('t6', 'light')
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 't6',
        newValue: JSON.stringify({ v: 1, value: 'dark' }),
        storageArea: localStorage,
      }),
    )
    expect(sig.value).toBe('dark')
  })
})

describe('persistedSignal (async driver)', () => {
  function asyncDriver(stored: string | null): StorageDriver {
    const inner = memoryDriver()
    return {
      get: () => Promise.resolve(stored),
      set: (k, v) => inner.set(k, v),
      remove: (k) => inner.remove(k),
    }
  }

  it('exposes ready=false until hydration completes', async () => {
    const sig = persistedSignal('a1', 0, {
      driver: asyncDriver(JSON.stringify({ v: 1, value: 42 })),
    })
    expect(sig.ready.value).toBe(false)
    expect(sig.value).toBe(0)
    await vi.waitFor(() => expect(sig.ready.value).toBe(true))
    expect(sig.value).toBe(42)
  })
})
