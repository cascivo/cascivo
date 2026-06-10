import type { ComponentChildren } from 'preact'

export interface EmptyStateProps {
  icon?: ComponentChildren
  title: string
  description?: string
  action?: ComponentChildren
  size?: 'md' | 'lg'
  className?: string
  [key: string]: unknown
}

export declare function EmptyState(props: EmptyStateProps): JSX.Element
