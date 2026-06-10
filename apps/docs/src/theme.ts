import { persistedSignal } from '@cascade-ui/storage'

export type Theme = 'light' | 'dark' | 'warm'

export const THEMES: Theme[] = ['light', 'dark', 'warm']

const STORAGE_KEY = 'cascade-theme'

// Pre-storage versions stored the raw theme string — wrap it once.
const legacy = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
if (legacy === 'light' || legacy === 'dark' || legacy === 'warm') {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, value: legacy }))
}

export const theme = persistedSignal<Theme>(STORAGE_KEY, 'light')

export function applyTheme(next: Theme): void {
  const apply = () => document.documentElement.setAttribute('data-theme', next)
  // Cross-fade the page on theme change where supported (View Transitions API)
  if (
    typeof document.startViewTransition === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    document.startViewTransition(apply)
  } else {
    apply()
  }
  theme.value = next
}
