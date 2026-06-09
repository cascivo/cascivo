import type { ComponentChildren, VNode } from 'preact'

export interface DropdownItem {
  label: string
  value: string
  icon?: ComponentChildren
  disabled?: boolean
  separator?: boolean
}

export interface DropdownProps {
  trigger: VNode
  items: DropdownItem[]
  onSelect?: (value: string) => void
  placement?: 'bottom-start' | 'bottom-end'
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export declare function Dropdown(props: DropdownProps): JSX.Element
