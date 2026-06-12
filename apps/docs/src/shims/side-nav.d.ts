import type { ComponentChildren } from 'preact'

export interface SideNavSubItem {
  label: string
  href: string
  active?: boolean
}

export interface SideNavItem {
  label: string
  href?: string
  icon?: ComponentChildren
  active?: boolean
  items?: SideNavSubItem[]
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
  className?: string
}

export declare function SideNav(props: SideNavProps): JSX.Element
