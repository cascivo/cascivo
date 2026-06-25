import type { ComponentChildren } from 'preact'

export interface CommandItem {
  id: string
  label: string
  icon?: ComponentChildren
  shortcut?: string[]
  keywords?: string[]
  onSelect?: () => void
  disabled?: boolean
  page?: CommandPage
}

export interface CommandGroup {
  heading?: string
  items: CommandItem[]
}

export interface CommandPage {
  placeholder?: string
  groups: CommandGroup[]
}

export interface CommandMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: CommandGroup[]
  placeholder?: string
  emptyLabel?: string
  hotkey?: boolean
  label?: string
  loading?: boolean
  onQueryChange?: (query: string) => void
  className?: string
}

export declare function CommandMenu(props: CommandMenuProps): JSX.Element
export declare function fuzzyScore(query: string, text: string): number
