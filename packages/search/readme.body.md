> **Status: experimental** — API unstable, not yet part of the supported surface.

In-memory search index and search dialog for the cascivo ecosystem — powers the docs-site search over components, guides, and pages. Private workspace package; not published to npm.

## What's inside

Two entry points:

- `@cascivo/search` — `SearchItem` + `SearchIndex` (pure TypeScript, no React).
- `@cascivo/search/SearchDialog` — a `SearchDialog` React component built on the cascivo `CommandMenu`.

## `SearchIndex`

A tiny scored substring index. No fuzzy matching, no tokenization — exact-match and prefix/substring scoring over title, description, keywords, section, and category:

```ts
import { SearchIndex, type SearchItem } from '@cascivo/search'

const items: SearchItem[] = [
  {
    id: 'button',
    title: 'Button',
    href: '/components/button',
    type: 'component', // 'component' | 'page'
    category: 'inputs',
    description: 'Triggers an action or event',
    keywords: 'loading variant primary', // extra searchable terms (prop names, aliases)
  },
]

const index = new SearchIndex(items)
index.search('but') // → SearchItem[] ranked by score, max 8 by default
index.search('but', 20) // custom result limit
index.all() // every indexed item (for consumers that filter themselves)
```

Queries shorter than 2 characters return no results. Scoring order: exact title match > title prefix > title substring > description > keywords > section/category.

## `SearchDialog`

A controlled dialog that renders the whole index inside `CommandMenu` (which supplies fuzzy filtering, keyboard navigation, and the overlay panel). Pages are grouped first, components are grouped by category:

```tsx
import { SearchDialog } from '@cascivo/search/SearchDialog'
;<SearchDialog
  index={index}
  open={isOpen}
  onClose={() => setOpenSignal(false)}
  onNavigate={(href) => router.push(href)}
/>
```

Note: `SearchDialog` delegates filtering to `CommandMenu`'s fuzzy matcher over `index.all()`; the `SearchIndex.search()` scorer is used by consumers that render their own result list.
