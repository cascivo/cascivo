import { useSignal, useSignals } from '@cascade-ui/core'
import { useLocation } from 'preact-iso'
import { CommandMenu, type CommandGroup } from '@cascade-ui/components/command-menu'
import { buildNav } from './nav'

export function DocsSearch() {
  useSignals()
  const open = useSignal(false)
  const { route } = useLocation()

  const groups: CommandGroup[] = buildNav().map((group) => ({
    heading: group.label,
    items: group.items.map((item) => ({
      id: item.name,
      label: item.label,
      keywords: [group.label.toLowerCase()],
      onSelect: () => {
        route(item.href)
        open.value = false
      },
    })),
  }))

  return (
    <>
      <button type="button" class="search-trigger" onClick={() => (open.value = true)}>
        Search <kbd>⌘K</kbd>
      </button>
      <CommandMenu
        open={open.value}
        onOpenChange={(next) => (open.value = next)}
        groups={groups}
      />
    </>
  )
}
