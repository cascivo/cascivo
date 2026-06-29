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
