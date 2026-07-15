import type { ComponentChildren } from 'preact'

export interface CommandAction {
  id: string
  label: string
  shortcut?: string[]
  onSelect: () => void
}

export interface CommandStatus {
  label: string
  tone?: 'healthy' | 'degraded' | 'neutral'
}

export interface CommandItem {
  id: string
  label: string
  description?: string
  icon?: ComponentChildren
  shortcut?: string[]
  keywords?: string[]
  status?: CommandStatus
  actions?: CommandAction[]
  onSelect?: () => void
  disabled?: boolean
  page?: CommandPage
}

export interface CommandGroup {
  heading?: string
  scope?: string
  items: CommandItem[]
}

export interface CommandPage {
  placeholder?: string
  groups: CommandGroup[]
}

export interface CommandScope {
  id: string
  label: string
  prefix?: string
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
  scopes?: CommandScope[]
  className?: string
}

export interface FuzzyMatch {
  score: number
  indices: number[]
}

export declare function CommandMenu(props: CommandMenuProps): JSX.Element
export declare function fuzzyScore(query: string, text: string): number
export declare function fuzzyMatch(query: string, text: string): FuzzyMatch | null
