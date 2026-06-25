import type { ComponentChildren } from 'preact'

export interface LinkProps {
  variant?: 'standalone' | 'inline'
  size?: 'sm' | 'md' | 'lg'
  external?: boolean
  href?: string
  className?: string
  children?: ComponentChildren
  [key: string]: unknown
}

export declare function Link(props: LinkProps): JSX.Element
