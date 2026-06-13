import { effect } from '@cascade-ui/core'
import { persistedSignal } from '@cascade-ui/storage'

export const THEMES = [
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
] as const
export type ThemeName = (typeof THEMES)[number]

const systemDefault = (): ThemeName =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'

export const theme = persistedSignal<ThemeName>('cascade-landing-theme', systemDefault())

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function apply(next: ThemeName) {
  document.documentElement.dataset.theme = next
}

export function setTheme(next: ThemeName) {
  if (!reducedMotion() && 'startViewTransition' in document) {
    ;(document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(
      () => apply(next),
    )
  } else {
    apply(next)
  }
  theme.value = next
}

// Keep the DOM in sync on load + external writes (storage events from other tabs)
effect(() => apply(theme.value))
