import registry from '../../../../../registry.json'
import { SearchIndex, type SearchItem } from '@cascivo/search'

interface RegEntry {
  name: string
  category: string
  description?: string
  meta: {
    name: string
    description?: string
    props?: { name: string }[]
    variants?: string[]
    sizes?: string[]
  }
}

/**
 * Naming aliases → registry slug: queries for names other libraries use surface
 * the cascivo equivalent (e.g. "flex"/"box" → Stack). Keyed by registry slug.
 */
const ALIASES: Record<string, string> = {
  'layout/stack': 'flex hstack vstack row column inline cluster',
  'layout/columns': 'flex grid columns',
  'layout/auto-grid': 'grid responsive autogrid masonry',
  'layout/grid': 'grid flex',
  'layout/section': 'box container wrapper',
  'layout/center': 'box container center',
  'layout/spacer': 'gap space spacing divider',
}

const componentItems: SearchItem[] = (registry as { components: RegEntry[] }).components.map(
  (e) => {
    const description = e.meta.description ?? e.description
    const terms = [
      ...(e.meta.props ?? []).map((p) => p.name),
      ...(e.meta.variants ?? []),
      ...(e.meta.sizes ?? []),
      ALIASES[e.name] ?? '',
    ]
      .filter(Boolean)
      .join(' ')
    return {
      // e.name is the kebab-case registry slug (e.g. "shell-header"); meta.name
      // is the PascalCase display name. Docs URLs use the kebab slug.
      id: `component-${e.name}`,
      title: e.meta.name,
      section: e.category,
      ...(description ? { description } : {}),
      href: `/docs/components/${e.name}`,
      type: 'component' as const,
      category: e.category,
      ...(terms ? { keywords: terms } : {}),
    }
  },
)

const PAGE_SECTIONS: SearchItem[] = [
  { id: 'page-home', title: 'Home', section: 'Landing', href: '/', type: 'page' },
  {
    id: 'page-a11y',
    title: 'Accessibility',
    section: 'Landing',
    href: '/accessibility',
    type: 'page',
  },
  { id: 'page-perf', title: 'Performance', section: 'Landing', href: '/performance', type: 'page' },
  { id: 'page-guides', title: 'Guides', section: 'Landing', href: '/guides', type: 'page' },
  { id: 'page-examples', title: 'Examples', section: 'Landing', href: '/examples', type: 'page' },
  {
    id: 'page-ai',
    title: 'AI layer',
    section: 'Landing',
    href: '/ai',
    type: 'page',
    description: 'Manifests, MCP server, skills, and llms.txt — the AI-first layer',
  },
  {
    id: 'page-quickstart',
    title: 'Quick Start',
    section: 'Home',
    href: '/#quickstart',
    type: 'page',
    description: 'Get up and running in three steps',
  },
  {
    id: 'page-theming',
    title: 'Theming',
    section: 'Home',
    href: '/#advantages',
    type: 'page',
    description: 'Ten token-driven themes — swap data-theme to restyle everything',
  },
  {
    id: 'page-charts',
    title: 'Charts',
    section: 'Landing',
    href: '/examples#charts',
    type: 'page',
    description: 'Data visualisation built with cascivo',
  },
  {
    id: 'page-tech',
    title: 'Modern CSS',
    section: 'Landing',
    href: '/modern-css',
    type: 'page',
    description: '@layer, @container, :has() explained',
  },
]

export const landingIndex = new SearchIndex([...componentItems, ...PAGE_SECTIONS])
