import { CATEGORY_LABELS, CATEGORY_ORDER, components, type Category } from './data'

export interface NavItem {
  name: string
  label: string
  href: string
}

export interface NavGroup {
  category: Category
  label: string
  items: NavItem[]
}

/** Navigation tree grouped by component category, derived from the registry. */
export function buildNav(): NavGroup[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    items: components
      .filter((c) => c.category === category)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({
        name: c.name,
        label: c.meta.name,
        href: `/components/${c.name}`,
      })),
  })).filter((group) => group.items.length > 0)
}
