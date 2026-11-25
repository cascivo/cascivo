import { effect } from '@cascivo/core'
import { persistedSignal } from '@cascivo/storage'

export const FONT_CHOICES = ['default', 'cascivo', 'sans', 'mono', 'serif', 'condensed'] as const
export type FontChoice = (typeof FONT_CHOICES)[number]

export function isFontChoice(value: unknown): value is FontChoice {
  return FONT_CHOICES.some((c) => c === value)
}

/**
 * The typeface the whole site is set in. Persisted (storage failures are swallowed by
 * persistedSignal). The key predates the choice list: v1 stored a boolean, so v2 migrates
 * `true` → 'sans' and anything else → 'default'; unknown stored values fall back to 'default'.
 */
export const siteFont = persistedSignal<FontChoice>('cascivo-font-sans', 'default', {
  version: 2,
  migrate: (old) => (old === true ? 'sans' : 'default'),
  parse: (raw) => (isFontChoice(raw) ? raw : 'default'),
})

const loaders: Record<Exclude<FontChoice, 'default'>, () => Promise<unknown>> = {
  cascivo: () =>
    Promise.all([
      import('./pages/cascivo-sans/font.css'),
      import('./font-faces/mono.css'),
      import('./font-faces/serif.css'),
      import('./font-faces/condensed.css'),
    ]),
  sans: () => import('./pages/cascivo-sans/font.css'),
  mono: () => import('./font-faces/mono.css'),
  serif: () => import('./font-faces/serif.css'),
  condensed: () => import('./font-faces/condensed.css'),
}
const loaded = new Set<FontChoice>()

// @font-face rules are imported only for the chosen family, so visitors who never opt in
// download nothing extra.
function loadFaces(choice: Exclude<FontChoice, 'default'>): void {
  if (loaded.has(choice)) return
  loaded.add(choice)
  void loaders[choice]()
}

if (typeof document !== 'undefined') {
  effect(() => {
    const root = document.documentElement
    const choice = siteFont.value
    if (choice === 'default') {
      root.removeAttribute('data-font')
    } else {
      loadFaces(choice)
      root.setAttribute('data-font', choice === 'cascivo' ? 'cascivo' : `cascivo-${choice}`)
    }
  })
}
