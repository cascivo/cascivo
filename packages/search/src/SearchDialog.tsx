'use client'
import { CommandMenu } from '@cascivo/components/command-menu'
import { searchScopes, toGroups, type SearchIndex } from './index'

export interface SearchDialogProps {
  index: SearchIndex
  open: boolean
  onClose: () => void
  onNavigate: (href: string) => void
}

/** Open a result in a new browser tab (the palette's ⌘↵ / "New tab" action). */
function openInNewTab(href: string) {
  if (typeof window !== 'undefined') window.open(href, '_blank', 'noopener,noreferrer')
}

export function SearchDialog({ index, open, onClose, onNavigate }: SearchDialogProps) {
  const groups = toGroups(index.all(), onNavigate, openInNewTab)
  return (
    <CommandMenu
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      groups={groups}
      scopes={searchScopes}
      hotkey={false}
      placeholder="Search… (try c: for components, p: for pages)"
      emptyLabel="No results"
      label="Search"
    />
  )
}
