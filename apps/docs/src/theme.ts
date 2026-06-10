export type Theme = 'light' | 'dark' | 'warm'

export const THEMES: Theme[] = ['light', 'dark', 'warm']

const STORAGE_KEY = 'cascade-theme'

export function getStoredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'dark' || stored === 'warm' || stored === 'light' ? stored : 'light'
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(STORAGE_KEY, theme)
}
