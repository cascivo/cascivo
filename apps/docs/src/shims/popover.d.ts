import type { ComponentChildren } from 'preact'

export declare function Popover(props: {
  children?: ComponentChildren
  open?: boolean
  onOpenChange?: (open: boolean) => void
  [key: string]: unknown
}): JSX.Element
export declare function PopoverTrigger(props: {
  children?: ComponentChildren
  [key: string]: unknown
}): JSX.Element
export declare function PopoverContent(props: {
  children?: ComponentChildren
  className?: string
  [key: string]: unknown
}): JSX.Element
