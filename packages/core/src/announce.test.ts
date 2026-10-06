import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { announce } from './announce'

function regionFor(role: 'status' | 'alert'): HTMLElement | null {
  return document.querySelector(`[role="${role}"][aria-live]`)
}

describe('announce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('writes the message into one persistent polite region', () => {
    announce('Response complete')
    const el = regionFor('status')
    expect(el?.getAttribute('aria-live')).toBe('polite')
    expect(el?.getAttribute('aria-atomic')).toBe('true')
    expect(el?.textContent).toBe('')
    vi.advanceTimersByTime(50)
    expect(el?.textContent).toBe('Response complete')

    announce('Again')
    expect(document.querySelectorAll('[role="status"][aria-live]')).toHaveLength(1)
  })

  it('makes a repeated message audible by clearing before writing', () => {
    announce('Copied')
    vi.advanceTimersByTime(50)
    announce('Copied')
    expect(regionFor('status')?.textContent).toBe('')
    vi.advanceTimersByTime(50)
    expect(regionFor('status')?.textContent).toBe('Copied')
  })

  it('uses a separate assertive region', () => {
    announce('Generation failed', { politeness: 'assertive' })
    vi.advanceTimersByTime(50)
    const el = regionFor('alert')
    expect(el?.getAttribute('aria-live')).toBe('assertive')
    expect(el?.textContent).toBe('Generation failed')
  })

  it('lets a newer announcement in the same batch replace a queued one', () => {
    announce('Loading…', { batchId: 'msg-1' })
    announce('Still loading…', { batchId: 'msg-1' })
    announce('Done', { batchId: 'msg-1' })
    vi.advanceTimersByTime(50)
    expect(regionFor('status')?.textContent).toBe('Done')
  })

  it('recreates its region if something removed it', () => {
    announce('One')
    regionFor('status')?.remove()
    announce('Two')
    vi.advanceTimersByTime(50)
    expect(regionFor('status')?.textContent).toBe('Two')
  })
})
