import type { ComponentChildren, VNode } from 'preact'

export interface TooltipProps {
  content: ComponentChildren
  placement?: 'top' | 'right' | 'bottom' | 'left'
  children: VNode
  delay?: number
}

export declare function Tooltip(props: TooltipProps): JSX.Element
