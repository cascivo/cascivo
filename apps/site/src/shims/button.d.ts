import type { ComponentChildren } from 'preact'

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  className?: string
  onClick?: (e: MouseEvent) => void
  children?: ComponentChildren
  [key: string]: unknown
}

export declare function Button(props: ButtonProps): JSX.Element
