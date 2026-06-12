import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createShellState } from './shell-state'

beforeEach(() => {
  localStorage.clear()
})

describe('createShellState', () => {
  it('starts expanded, drawer closed, aside open', () => {
    const s = createShellState({ persistKey: false })
    expect(s.sideNavCollapsed.value).toBe(false)
    expect(s.sideNavOpen.value).toBe(false)
    expect(s.asideOpen.value).toBe(true)
  })

  it('toggleAside flips asideOpen', () => {
    const s = createShellState({ persistKey: false })
    s.toggleAside()
    expect(s.asideOpen.value).toBe(false)
  })

  it('toggleSideNav toggles collapse on desktop', () => {
    window.matchMedia = ((q: string) => ({ matches: true, media: q })) as never
    const s = createShellState({ persistKey: false })
    s.toggleSideNav()
    expect(s.sideNavCollapsed.value).toBe(true)
    expect(s.sideNavOpen.value).toBe(false)
  })

  it('toggleSideNav toggles the drawer on mobile', () => {
    window.matchMedia = ((q: string) => ({ matches: false, media: q })) as never
    const s = createShellState({ persistKey: false })
    s.toggleSideNav()
    expect(s.sideNavOpen.value).toBe(true)
    expect(s.sideNavCollapsed.value).toBe(false)
  })

  it('persists collapse and aside under derived keys', () => {
    const s = createShellState({ persistKey: 'test.shell' })
    s.sideNavCollapsed.value = true
    const s2 = createShellState({ persistKey: 'test.shell' })
    expect(s2.sideNavCollapsed.value).toBe(true)
  })
})

describe('shell loading state', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('is hidden by default', () => {
    const shell = createShellState({ persistKey: false })
    expect(shell.loadingProgress.value).toBeNull()
    expect(shell.loadingError.value).toBeNull()
  })

  it('startLoading shows the bar at 0 and clears a previous error', () => {
    const shell = createShellState({ persistKey: false })
    shell.failLoading('boom')
    shell.startLoading()
    expect(shell.loadingProgress.value).toBe(0)
    expect(shell.loadingError.value).toBeNull()
  })

  it('setLoadingProgress clamps to [0, 1]', () => {
    const shell = createShellState({ persistKey: false })
    shell.startLoading()
    shell.setLoadingProgress(0.6)
    expect(shell.loadingProgress.value).toBe(0.6)
    shell.setLoadingProgress(1.7)
    expect(shell.loadingProgress.value).toBe(1)
    shell.setLoadingProgress(-1)
    expect(shell.loadingProgress.value).toBe(0)
  })

  it('finishLoading snaps to 1, then hides after the fade delay', () => {
    const shell = createShellState({ persistKey: false })
    shell.startLoading()
    shell.finishLoading()
    expect(shell.loadingProgress.value).toBe(1)
    vi.advanceTimersByTime(400)
    expect(shell.loadingProgress.value).toBeNull()
  })

  it('startLoading cancels a pending finish hide', () => {
    const shell = createShellState({ persistKey: false })
    shell.startLoading()
    shell.finishLoading()
    shell.startLoading() // new pass before the 400ms hide fires
    vi.advanceTimersByTime(400)
    expect(shell.loadingProgress.value).toBe(0) // still visible
  })

  it('failLoading keeps the bar, sets the message; clearLoadingError hides both', () => {
    const shell = createShellState({ persistKey: false })
    shell.startLoading()
    shell.setLoadingProgress(0.4)
    shell.failLoading('Sync failed')
    expect(shell.loadingProgress.value).toBe(0.4)
    expect(shell.loadingError.value).toBe('Sync failed')
    shell.clearLoadingError()
    expect(shell.loadingError.value).toBeNull()
    expect(shell.loadingProgress.value).toBeNull()
  })
})
