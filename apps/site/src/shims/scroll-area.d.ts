import type { ComponentChildren } from 'preact'

export declare function ScrollArea(props: {
  height?: string
  width?: string
  orientation?: 'vertical' | 'horizontal' | 'both'
  edges?: 'shadow' | 'mask' | 'none'
  className?: string
  children?: ComponentChildren
  [key: string]: unknown
}): JSX.Element
