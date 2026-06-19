import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useMutationObserver } from './mutation-observer'

let cb: MutationCallback | null = null
const observe = vi.fn()
const disconnect = vi.fn()

class MockMutationObserver {
  observe = observe
  disconnect = disconnect
  takeRecords = (): MutationRecord[] => []
  constructor(callback: MutationCallback) {
    cb = callback
  }
}

beforeEach(() => {
  cb = null
  observe.mockClear()
  disconnect.mockClear()
  vi.stubGlobal('MutationObserver', MockMutationObserver)
})
afterEach(() => vi.unstubAllGlobals())

describe('useMutationObserver', () => {
  it('observes the node with the given init and exposes the latest records', () => {
    const node = document.createElement('div')
    const { result } = renderHook(() => {
      const r = useMutationObserver<HTMLDivElement>({ attributes: true })
      r.ref.current = node
      return r
    })
    expect(observe).toHaveBeenCalledWith(node, { attributes: true })
    expect(result.current.records.value).toEqual([])
    const record = { type: 'attributes' } as MutationRecord
    cb?.([record], {} as MutationObserver)
    expect(result.current.records.value).toEqual([record])
  })

  it('defaults to observing childList', () => {
    const node = document.createElement('div')
    renderHook(() => {
      const r = useMutationObserver<HTMLDivElement>()
      r.ref.current = node
      return r
    })
    expect(observe).toHaveBeenCalledWith(node, { childList: true })
  })

  it('disconnects on unmount', () => {
    const node = document.createElement('div')
    const { unmount } = renderHook(() => {
      const r = useMutationObserver<HTMLDivElement>()
      r.ref.current = node
      return r
    })
    unmount()
    expect(disconnect).toHaveBeenCalled()
  })
})
