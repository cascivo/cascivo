import { beforeEach, describe, expect, it } from 'vitest'
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
