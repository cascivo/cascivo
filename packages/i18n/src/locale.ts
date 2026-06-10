import { signal } from '@cascade-ui/core'
import type { ReadonlySignal } from '@cascade-ui/core'

// Module-global active locale: t() and the formatters resolve against this,
// so components need no provider — zero-config means default locale ('en').
const activeLocale = signal('en')

export function currentLocale(): string {
  return activeLocale.value
}

export interface LocaleStore<L extends string> {
  locale: ReadonlySignal<L>
  supported: readonly L[]
  set(locale: L): Promise<void>
  /** Lazy catalog: `store.registerCatalog('de', () => import('./de'))`. */
  registerCatalog(locale: L, load: () => Promise<unknown>): void
}

export function createLocale<const L extends string>(options: {
  default: L
  supported: readonly L[]
}): LocaleStore<L> {
  const loaders = new Map<L, () => Promise<unknown>>()
  const loaded = new Set<L>([options.default])
  activeLocale.value = options.default

  return {
    locale: activeLocale as ReadonlySignal<L>,
    supported: options.supported,
    registerCatalog(locale, load) {
      loaders.set(locale, load)
    },
    async set(locale) {
      if (!options.supported.includes(locale)) {
        throw new Error(
          `Unsupported locale "${locale}" (supported: ${options.supported.join(', ')})`,
        )
      }
      const load = loaders.get(locale)
      if (load && !loaded.has(locale)) {
        await load()
        loaded.add(locale)
      }
      activeLocale.value = locale
    },
  }
}
