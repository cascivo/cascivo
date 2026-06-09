import type { ComponentChildren } from 'preact'

export interface BadgeProps {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'
  size?: 'sm' | 'md'
  className?: string
  children?: ComponentChildren
  [key: string]: unknown
}

export declare function Badge(props: BadgeProps): JSX.Element
