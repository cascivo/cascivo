import type { ComponentChildren } from 'preact'

export declare function HoverCard(props: {
  children?: ComponentChildren
  openDelay?: number
  closeDelay?: number
  [key: string]: unknown
}): JSX.Element
export declare function HoverCardTrigger(props: {
  children?: ComponentChildren
  [key: string]: unknown
}): JSX.Element
export declare function HoverCardContent(props: {
  children?: ComponentChildren
  className?: string
  [key: string]: unknown
}): JSX.Element
