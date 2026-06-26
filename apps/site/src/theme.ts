import { effect } from '@cascivo/core'
import { persistedSignal } from '@cascivo/storage'

export type Theme =
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
if (
  legacy === 'light' ||
  legacy === 'dark' ||
  legacy === 'warm' ||
  legacy === 'flat' ||
  legacy === 'minimal' ||
  legacy === 'midnight' ||
  legacy === 'pastel' ||
  legacy === 'brutalist' ||
  legacy === 'corporate' ||
  legacy === 'terminal' ||
  legacy === 'cyberpunk' ||
  legacy === 'arcade'
) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, value: legacy }))
}

export const theme = persistedSignal<Theme>(STORAGE_KEY, 'dark')

// Only light/dark/warm are render-blocking. The rest live in a deferred chunk
// (themes-extra.css) so they stay off the home critical path; we load it lazily
// the first time an extra theme is active or selected, and gate applying the
// `data-theme` attribute on it so an extra theme never paints unstyled.
const CORE_THEMES: Theme[] = ['light', 'dark', 'warm']
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
