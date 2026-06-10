export type Theme = 'light' | 'dark' | 'warm'

export const THEMES: Theme[] = ['light', 'dark', 'warm']

const STORAGE_KEY = 'cascade-theme'

export function getStoredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'dark' || stored === 'warm' || stored === 'light' ? stored : 'light'
}

export function applyTheme(theme: Theme): void {
  const apply = () => document.documentElement.setAttribute('data-theme', theme)
  // Cross-fade the page on theme change where supported (View Transitions API)
  if (
    typeof document.startViewTransition === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    document.startViewTransition(apply)
  } else {
    apply()
  }
  localStorage.setItem(STORAGE_KEY, theme)
}
