import type { ComponentChildren } from 'preact'

export interface OverflowMenuItem {
  label: string
  value: string
  icon?: ComponentChildren
  disabled?: boolean
  destructive?: boolean
}

export interface OverflowMenuProps {
  items: OverflowMenuItem[]
  onSelect?: (value: string) => void
  placement?: 'bottom-start' | 'bottom-end'
  ariaLabel?: string
  size?: 'sm' | 'md'
  disabled?: boolean
  className?: string
}

export declare function OverflowMenu(props: OverflowMenuProps): JSX.Element
