import type { ComponentChildren } from 'preact'

export interface HeaderLink {
  label: string
  href: string
  active?: boolean
}

export interface HeaderLabels {
  nav?: string
}

export interface HeaderProps {
  brand?: ComponentChildren
  links?: HeaderLink[]
  actions?: ComponentChildren
  sticky?: boolean
  labels?: HeaderLabels
  className?: string
  [key: string]: unknown
}

export declare function Header(props: HeaderProps): JSX.Element
