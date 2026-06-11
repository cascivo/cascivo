import { signal, type Signal } from '@cascade-ui/core'
import { persistedSignal } from '@cascade-ui/storage'

export interface ShellState {
  /** Desktop: side nav collapsed to the icon rail. Persisted. */
  sideNavCollapsed: Signal<boolean>
  /** Mobile: side nav drawer open. Never persisted. */
  sideNavOpen: Signal<boolean>
  /** Right aside visible. Persisted. */
  asideOpen: Signal<boolean>
  /** Hamburger handler: drawer on mobile, collapse on desktop (resolved at call time). */
  toggleSideNav: () => void
  toggleAside: () => void
}

export interface CreateShellStateOptions {
  /** Storage key prefix; false disables persistence. Default: 'cascade.shell'. */
  persistKey?: string | false
}

const DESKTOP = '(min-width: 64rem)'

function isDesktop(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true
  return window.matchMedia(DESKTOP).matches
}

export function createShellState(options: CreateShellStateOptions = {}): ShellState {
  const key = options.persistKey ?? 'cascade.shell'
  const sideNavCollapsed = key === false ? signal(false) : persistedSignal(`${key}.sidenav`, false)
  const asideOpen = key === false ? signal(true) : persistedSignal(`${key}.aside`, true)
  const sideNavOpen = signal(false)

  return {
    sideNavCollapsed,
    sideNavOpen,
    asideOpen,
    toggleSideNav: () => {
      if (isDesktop()) {
        sideNavCollapsed.value = !sideNavCollapsed.value
      } else {
        sideNavOpen.value = !sideNavOpen.value
      }
    },
    toggleAside: () => {
      asideOpen.value = !asideOpen.value
    },
  }
}
