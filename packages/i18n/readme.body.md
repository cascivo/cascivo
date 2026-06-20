A signal-driven internationalisation layer for cascivo — a reactive locale store, typed message catalogs, and `Intl`-based formatting. Every component reads its user-visible strings from the built-in catalog, so the whole system localizes from one place. Zero-config: with no setup, everything resolves against the default `'en'` locale.

## Usage

```tsx
import { createLocale, t, builtin } from '@cascivo/i18n'

const i18n = createLocale({ default: 'en', supported: ['en', 'de'] })
i18n.registerCatalog('de', () => import('./catalogs/de'))

await i18n.set('de') // every subscribed component re-renders reactively

t(builtin.button.loading) // resolves against the active locale
```

Because the active locale is a signal, changing it updates every component that reads a catalog string — no context provider, no re-mount. Catalogs are registered lazily and loaded on demand.

## Overriding strings per instance

Components default to the built-in catalog but accept a `labels` prop to override per-instance:

```tsx
<Pagination labels={{ next: 'Suivant', previous: 'Précédent' }} />
```

## Formatting

Typed helpers wrap the `Intl` APIs and follow the active locale:

```ts
import {
  formatNumber,
  formatDate,
  formatRelativeTime,
  formatList,
  formatBytes,
} from '@cascivo/i18n'

formatNumber(1234.5, { style: 'currency', currency: 'EUR' })
formatRelativeTime(-2, 'day') // → "2 days ago" / "vor 2 Tagen"
```

Define your own typed catalogs with `defineCatalog` / `defineMessages` for full type-safety on keys and interpolation values.
