'use client'
import { CommandMenu, type CommandGroup, type CommandItem } from '@cascivo/components/command-menu'
import type { SearchIndex, SearchItem } from './index'

export interface SearchDialogProps {
  index: SearchIndex
  open: boolean
  onClose: () => void
  onNavigate: (href: string) => void
}

/**
 * Build CommandMenu groups from the search items. Pages are grouped first;
 * components are grouped by category. CommandMenu handles fuzzy filtering,
 * keyboard navigation, focus, and the opaque overlay panel.
 */
function toGroups(items: SearchItem[], onNavigate: (href: string) => void): CommandGroup[] {
  const toItem = (item: SearchItem): CommandItem => ({
    id: item.id,
    label: item.title,
    keywords: [item.section, item.description, item.category].filter((k): k is string =>
      Boolean(k),
    ),
    onSelect: () => onNavigate(item.href),
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
  if (pages.length > 0) groups.push({ heading: 'Pages', items: pages.map(toItem) })
  for (const [cat, list] of byCategory) {
    groups.push({ heading: cat, items: list.map(toItem) })
  }
  return groups
}

export function SearchDialog({ index, open, onClose, onNavigate }: SearchDialogProps) {
  const groups = toGroups(index.all(), onNavigate)
  return (
    <CommandMenu
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      groups={groups}
      hotkey={false}
      placeholder="Search components, guides…"
      emptyLabel="No results"
      label="Search"
    />
  )
}
