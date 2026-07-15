import type { CommandGroup, CommandItem, CommandScope } from '@cascivo/components/command-menu'

export interface SearchItem {
  id: string
  title: string
  section?: string
  description?: string
  href: string
  type: 'component' | 'page'
  category?: string
  /**
   * Extra searchable terms not shown as the title/description — prop names,
   * variant/size values, and naming aliases (e.g. `flex`/`box` → Stack). Lets a
   * query like "loading" or "flex" surface the components that expose them.
   */
  keywords?: string
}

export class SearchIndex {
  private items: SearchItem[]

  constructor(items: SearchItem[]) {
    this.items = items
  }

  /** All indexed items (used by consumers that do their own filtering). */
  all(): SearchItem[] {
    return this.items
  }

  search(query: string, limit = 8): SearchItem[] {
    const q = query.toLowerCase().trim()
    if (q.length < 2) return []

    const score = (item: SearchItem): number => {
      const title = item.title.toLowerCase()
      const desc = item.description?.toLowerCase() ?? ''
      const section = item.section?.toLowerCase() ?? ''
      const category = item.category?.toLowerCase() ?? ''
      const keywords = item.keywords?.toLowerCase() ?? ''

      if (title === q) return 100
      if (title.startsWith(q)) return 80
      if (title.includes(q)) return 60
      if (desc.includes(q)) return 40
      if (keywords.includes(q)) return 30
      if (section.includes(q) || category.includes(q)) return 20
      return 0
    }

    return this.items
      .map((item) => ({ item, score: score(item) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ item }) => item)
  }
}

/** Filter scopes for the search dialog: components (`c:`) and pages (`p:`). */
export const searchScopes: CommandScope[] = [
  { id: 'components', label: 'Components', prefix: 'c' },
  { id: 'pages', label: 'Pages', prefix: 'p' },
]

/**
 * Build CommandMenu groups from search items: a "Pages" group first (scope
 * `pages`), then components grouped by category (scope `components`). Each row
 * shows the item description as a mono metadata line and reveals Open (↵) /
 * New tab (⌘↵) inline actions. CommandMenu handles fuzzy filtering + match
 * highlighting, keyboard navigation, focus, and the overlay panel.
 */
export function toGroups(
  items: SearchItem[],
  onOpen: (href: string) => void,
  onOpenNewTab: (href: string) => void,
): CommandGroup[] {
  const toItem = (item: SearchItem): CommandItem => ({
    id: item.id,
    label: item.title,
    ...(item.description ? { description: item.description } : {}),
    keywords: [item.section, item.description, item.category, item.keywords].filter(
      (k): k is string => Boolean(k),
    ),
    actions: [
      { id: `${item.id}-open`, label: 'Open', shortcut: ['↵'], onSelect: () => onOpen(item.href) },
      {
        id: `${item.id}-tab`,
        label: 'New tab',
        shortcut: ['⌘', '↵'],
        onSelect: () => onOpenNewTab(item.href),
      },
    ],
  })

  const pages = items.filter((i) => i.type === 'page')
  const components = items.filter((i) => i.type === 'component')

  const byCategory = new Map<string, SearchItem[]>()
  for (const c of components) {
    const cat = c.category ?? 'Components'
    const list = byCategory.get(cat)
    if (list) list.push(c)
    else byCategory.set(cat, [c])
  }

  const groups: CommandGroup[] = []
  if (pages.length > 0) groups.push({ heading: 'Pages', scope: 'pages', items: pages.map(toItem) })
  for (const [cat, list] of byCategory) {
    groups.push({ heading: cat, scope: 'components', items: list.map(toItem) })
  }
  return groups
}
