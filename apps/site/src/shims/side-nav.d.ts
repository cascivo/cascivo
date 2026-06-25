import type { ComponentChildren } from 'preact'

export type SideNavTone = 'default' | 'danger' | 'warning' | 'success'

export interface SideNavLinkSubItem {
  label: string
  href?: string
  icon?: ComponentChildren
  active?: boolean
  selected?: boolean
  onSelect?: () => void
  disabled?: boolean
}

export type SideNavSubItem =
  | SideNavLinkSubItem
  | { type: 'separator' }
  | { type: 'label'; label: string }

export interface SideNavItem {
  label: string
  href?: string
  icon?: ComponentChildren
  active?: boolean
  items?: SideNavSubItem[]
  onClick?: (e: MouseEvent) => void
  disabled?: boolean
  tone?: SideNavTone
  trailing?: ComponentChildren
  render?: (ctx: { collapsed: boolean }) => ComponentChildren
}

export interface SideNavProps {
  items: SideNavItem[]
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  ariaLabel?: string
  collapseLabel?: string
  expandLabel?: string
  showCollapseToggle?: boolean
  header?: ComponentChildren
  footer?: ComponentChildren
  className?: string
}

export declare function SideNav(props: SideNavProps): JSX.Element
