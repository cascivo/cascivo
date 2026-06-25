import type { ComponentChildren } from 'preact'

export interface KbdProps {
  size?: 'sm' | 'md'
  className?: string
  children?: ComponentChildren
  [key: string]: unknown
}

export declare function Kbd(props: KbdProps): JSX.Element
