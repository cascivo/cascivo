import type { ComponentChildren } from 'preact'

export interface AlertProps {
  variant?: 'default' | 'info' | 'success' | 'warning' | 'destructive'
  title?: string
  icon?: ComponentChildren
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
  children?: ComponentChildren
  [key: string]: unknown
}

export declare function Alert(props: AlertProps): JSX.Element
