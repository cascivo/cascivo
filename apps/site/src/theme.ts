import { effect } from '@cascivo/core'
import { persistedSignal } from '@cascivo/storage'

export type Theme =
  | 'poster'
  | 'poster-dark'
  | 'light'
  | 'dark'
  | 'warm'
  | 'flat'
  | 'minimal'
  | 'midnight'
  | 'pastel'
  | 'brutalist'
  | 'corporate'
  | 'terminal'
  | 'cyberpunk'
  | 'arcade'

export const THEMES: Theme[] = [
  'poster',
  'poster-dark',
  'light',
  'dark',
  'warm',
  'flat',
  'minimal',
  'midnight',
  'pastel',
  'brutalist',
  'corporate',
  'terminal',
  'cyberpunk',
  'arcade',
]

const STORAGE_KEY = 'cascade-theme'

// Pre-storage versions stored the raw theme string — wrap it once.
const legacy = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
if (legacy !== null && (THEMES as string[]).includes(legacy)) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, value: legacy }))
}

// Default from the visitor's OS preference when nothing is stored yet. A
// persisted choice always wins — `persistedSignal` only falls back to this
// initial when storage is empty. Mirrors the pre-paint script in index.html.
function preferredTheme(): Theme {
  if (typeof window === 'undefined') return 'poster-dark'
  try {
    if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'poster'
  } catch {
    // matchMedia unavailable — fall through to the dark poster
  }
  return 'poster-dark'
}

export const theme = persistedSignal<Theme>(STORAGE_KEY, preferredTheme())

// Only the poster pair (the default) and light/dark/warm are render-blocking.
// The rest live in a deferred chunk (themes-extra.css) so they stay off the home
// critical path; we load it lazily the first time an extra theme is active or
// selected, and gate applying the `data-theme` attribute on it so an extra theme
// never paints unstyled.
const CORE_THEMES: Theme[] = ['poster', 'poster-dark', 'light', 'dark', 'warm']
let extrasLoaded = false
let extrasPromise: Promise<unknown> | null = null

function ensureThemeAssets(next: Theme): Promise<unknown> {
  if (extrasLoaded || CORE_THEMES.includes(next)) return Promise.resolve()
  if (!extrasPromise) {
    extrasPromise = import('./themes-extra.css').then((m) => {
      extrasLoaded = true
      return m
    })
  }
  return extrasPromise
}

function setThemeAttr(next: Theme): void {
  // If the persisted/selected theme changed again before the deferred CSS
  // resolved, the newer value wins — don't clobber it.
  if (theme.value === next) document.documentElement.setAttribute('data-theme', next)
}

// Keep data-theme in sync with the signal (covers cross-tab storage events).
if (typeof document !== 'undefined') {
  effect(() => {
    const next = theme.value
    if (extrasLoaded || CORE_THEMES.includes(next)) {
      document.documentElement.setAttribute('data-theme', next)
    } else {
      // Extra theme not yet styled — the inline head script already painted a
      // safe core theme; swap once its CSS lands.
      void ensureThemeAssets(next).then(() => setThemeAttr(next))
    }
  })
}

/**
 * Load every deferred theme stylesheet, without changing the active theme.
 *
 * The themes section on the home page scopes `data-theme` to a preview card, so
 * the twelve first-party themes must be present even while the page itself runs
 * on `poster`. It is called from a lazy, below-the-fold section, so the extra
 * CSS still never touches the critical path.
 */
export function loadAllThemes(): Promise<unknown> {
  if (extrasLoaded) return Promise.resolve()
  if (!extrasPromise) {
    extrasPromise = import('./themes-extra.css').then((m) => {
      extrasLoaded = true
      return m
    })
  }
  return extrasPromise
}

export function applyTheme(next: Theme): void {
  const apply = () => document.documentElement.setAttribute('data-theme', next)
  const run = () => {
    // Cross-fade the page on theme change where supported (View Transitions API)
    if (
      typeof document.startViewTransition === 'function' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      document.startViewTransition(apply)
    } else {
      apply()
    }
  }
  if (extrasLoaded || CORE_THEMES.includes(next)) {
    run()
  } else {
    void ensureThemeAssets(next).then(run)
  }
  theme.value = next
}

// Aliases for the marketing surface, which adopted `setTheme`/`ThemeName` names.
export type ThemeName = Theme
export const setTheme = applyTheme

// ── Light/dark scheme toggle (the poster header's single control) ─────────
// The dropdown still offers every look; this is the fast path between the two
// halves of one theme.

/** Themes that paint a dark surface (`color-scheme: dark`). */
const DARK_THEMES = new Set<Theme>(['poster-dark', 'dark', 'midnight', 'terminal', 'cyberpunk'])

/** Themes that ship as a light/dark pair. */
const SCHEME_PAIR: Partial<Record<Theme, Theme>> = {
  poster: 'poster-dark',
  'poster-dark': 'poster',
  light: 'dark',
  dark: 'light',
}

export function isDarkTheme(t: Theme): boolean {
  return DARK_THEMES.has(t)
}

/** The theme the scheme toggle would switch to — drives its icon and label. */
export function nextScheme(): Theme {
  return SCHEME_PAIR[theme.value] ?? (isDarkTheme(theme.value) ? 'poster' : 'poster-dark')
}

/**
 * Flip the current theme's light/dark half. A one-off look picked from the
 * dropdown has no counterpart, so it resolves to the opposite half of the
 * site's own poster pair — the toggle always has somewhere to go.
 */
export function toggleScheme(): void {
  applyTheme(nextScheme())
}
