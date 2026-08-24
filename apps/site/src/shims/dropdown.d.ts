import type { ComponentChildren, VNode } from 'preact'

export interface DropdownMenuItem {
  label: string
  value: string
  icon?: ComponentChildren
  disabled?: boolean
}

export interface DropdownSeparatorItem {
  kind: 'separator'
}

export type DropdownItem = DropdownMenuItem | DropdownSeparatorItem

export interface DropdownProps {
  trigger: VNode
  items: DropdownItem[]
  onSelect?: (value: string) => void
  placement?: 'bottom-start' | 'bottom-end'
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export declare function Dropdown(props: DropdownProps): JSX.Element
