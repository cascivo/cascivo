import { type Accessor, createSignal } from 'solid-js'

export type Catalog = Readonly<Record<string, string>>
export type Params = Readonly<Record<string, string | number>>

export interface I18n {
  locale: Accessor<string>
  setLocale: (locale: string) => void
  /** Reactive: re-evaluates when the locale changes. Missing keys return the key. */
  t: (key: string, params?: Params) => string
}

/**
 * Minimal reactive translator for islands: `{name}` interpolation over per-locale flat
 * catalogs, falling back to the first catalog. Not a wrapper over `@cascivo/i18n`, which
 * is built on `@preact/signals-react`; an island must not pull React-flavoured signals.
 */
export function createI18n(catalogs: Readonly<Record<string, Catalog>>, initial?: string): I18n {
  const first = Object.keys(catalogs)[0] ?? ''
  const pick = (l: string | undefined): string =>
    l && catalogs[l] ? l : catalogs[l?.split('-')[0] ?? ''] ? (l?.split('-')[0] ?? first) : first
  const [locale, set] = createSignal(
    pick(initial ?? (typeof document === 'undefined' ? undefined : document.documentElement.lang)),
  )
  return {
    locale,
    setLocale: (l) => set(pick(l)),
    t: (key, params) => {
      const raw = catalogs[locale()]?.[key] ?? catalogs[first]?.[key] ?? key
      return raw.replace(/\{(\w+)\}/g, (m, k: string) =>
        params && k in params ? String(params[k]) : m,
      )
    },
  }
}
