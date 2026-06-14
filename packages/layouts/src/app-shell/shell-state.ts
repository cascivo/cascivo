import { signal, type Signal } from '@cascivo/core'
import { persistedSignal } from '@cascivo/storage'
import { minWidth } from '@cascivo/tokens/screens'

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
  /** Top loading bar: null = hidden, 0–1 = determinate progress. Never persisted. */
  loadingProgress: Signal<number | null>
  /** Loading error message; non-null renders the dismissible alert strip. */
  loadingError: Signal<string | null>
  /** Show the bar at 0. Clears any error and any pending hide timer. */
  startLoading: () => void
  /** Update progress; clamped to [0, 1]. No-op if the bar is hidden. */
  setLoadingProgress: (fraction: number) => void
  /** Snap to 1 and hide after a short fade (400ms). */
  finishLoading: () => void
  /** Keep the bar (destructive style) and show a dismissible message. */
  failLoading: (message?: string) => void
  /** Dismiss the error and hide the bar. */
  clearLoadingError: () => void
}

export interface CreateShellStateOptions {
  /** Storage key prefix; false disables persistence. Default: 'cascade.shell'. */
  persistKey?: string | false
}

const DESKTOP = minWidth('lg') // '(min-width: 64rem)' — canonical lg breakpoint

function isDesktop(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true
  return window.matchMedia(DESKTOP).matches
}

export function createShellState(options: CreateShellStateOptions = {}): ShellState {
  const key = options.persistKey ?? 'cascade.shell'
  const sideNavCollapsed = key === false ? signal(false) : persistedSignal(`${key}.sidenav`, false)
  const asideOpen = key === false ? signal(true) : persistedSignal(`${key}.aside`, true)
  const sideNavOpen = signal(false)

  const loadingProgress = signal<number | null>(null)
  const loadingError = signal<string | null>(null)
  let hideTimer: ReturnType<typeof setTimeout> | undefined

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
    loadingProgress,
    loadingError,
    startLoading: () => {
      if (hideTimer !== undefined) clearTimeout(hideTimer)
      loadingError.value = null
      loadingProgress.value = 0
    },
    setLoadingProgress: (fraction) => {
      if (loadingProgress.value === null) return
      loadingProgress.value = Math.min(1, Math.max(0, fraction))
    },
    finishLoading: () => {
      loadingProgress.value = 1
      if (hideTimer !== undefined) clearTimeout(hideTimer)
      hideTimer = setTimeout(() => {
        loadingProgress.value = null
      }, 400)
    },
    failLoading: (message) => {
      loadingError.value = message ?? 'Loading failed'
    },
    clearLoadingError: () => {
      loadingError.value = null
      loadingProgress.value = null
    },
  }
}
