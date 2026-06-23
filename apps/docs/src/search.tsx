import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { useLocation } from 'preact-iso'
import { CommandMenu, type CommandGroup, type CommandItem } from '@cascivo/components/command-menu'
import { Button } from '@cascivo/components/button'
import { Kbd } from '@cascivo/components/kbd'
import { buildNav } from './nav'

interface IconCatalogEntry {
  name: string
  pascalName: string
  category: string
  keywords: string[]
}

export function DocsSearch() {
  useSignals()
  const open = useSignal(false)
  const icons = useSignal<IconCatalogEntry[]>([])
  const { route } = useLocation()

  // Lazy-load the icon catalog so every icon is findable from global search.
  useSignalEffect(() => {
    fetch('/icons.catalog.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { icons?: IconCatalogEntry[] } | null) => {
        if (data?.icons) icons.value = data.icons
      })
      .catch(() => {})
  })

  const go = (href: string) => {
    route(href)
    open.value = false
  }

  const groups: CommandGroup[] = buildNav().map((group) => ({
    heading: group.label,
    items: group.items.map((item) => ({
      id: item.name,
      label: item.label,
      keywords: [group.label.toLowerCase()],
      onSelect: () => go(item.href),
    })),
  }))

  // Icons: one entry into the gallery + a sub-page of every icon (kept off the
  // top level so the menu stays light — the icon list renders only when opened).
  const iconItems: CommandItem[] = icons.value.map((icon) => ({
    id: `icon-${icon.name}`,
    label: icon.pascalName,
    keywords: [icon.name, icon.category, ...icon.keywords],
    onSelect: () => go(`/icons?q=${encodeURIComponent(icon.name)}`),
  }))

  groups.push({
    heading: 'Icons',
    items: [
      {
        id: 'icons-gallery',
        label: 'Icon gallery',
        keywords: ['icons', 'svg'],
        onSelect: () => go('/icons'),
      },
      ...(iconItems.length > 0
        ? [
            {
              id: 'icons-search',
              label: `Search ${iconItems.length} icons…`,
              keywords: ['icons', 'svg', 'find'],
              page: {
                placeholder: 'Search icons…',
                groups: [{ heading: 'Icons', items: iconItems }],
              },
            } satisfies CommandItem,
          ]
        : []),
    ],
  })

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          open.value = true
        }}
      >
        Search <Kbd>⌘K</Kbd>
      </Button>
      <CommandMenu open={open.value} onOpenChange={(next) => (open.value = next)} groups={groups} />
    </>
  )
}
