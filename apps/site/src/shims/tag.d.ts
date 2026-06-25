import type { ComponentChildren } from 'preact'

export interface TagProps {
  variant?: 'default' | 'info' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md'
  onDismiss?: () => void
  dismissLabel?: string
  className?: string
  children?: ComponentChildren
  [key: string]: unknown
}

export declare function Tag(props: TagProps): JSX.Element
