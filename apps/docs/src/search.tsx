import { useSignal, useSignals } from '@cascivo/core'
import { useLocation } from 'preact-iso'
import { CommandMenu, type CommandGroup } from '@cascivo/components/command-menu'
import { Button } from '@cascivo/components/button'
import { Kbd } from '@cascivo/components/kbd'
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
