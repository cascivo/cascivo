import { type Accessor, createSignal } from 'solid-js'

export interface Theme {
  theme: Accessor<string>
  setTheme: (theme: string) => void
  /** Cycle through `themes` (default light/dark). */
  toggle: () => void
}

/**
 * Reads/writes `data-theme` on `<html>` (what `theme_script()` and the theme CSS key on) and
 * persists the choice under `key`. Any of the twelve theme names works with `setTheme`.
 */
export function createTheme(
  themes: readonly string[] = ['light', 'dark'],
  key = 'cv-theme',
): Theme {
  const root = document.documentElement
  const [theme, set] = createSignal(root.dataset.theme ?? themes[0] ?? 'light')
  const setTheme = (t: string): void => {
    root.dataset.theme = t
    set(t)
    try {
      localStorage.setItem(key, t)
    } catch {
      // storage can be blocked; the attribute still applies for this page.
    }
  }
  return {
    theme,
    setTheme,
    toggle: () => setTheme(themes[(themes.indexOf(theme()) + 1) % themes.length] ?? theme()),
  }
}
