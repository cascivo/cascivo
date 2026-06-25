import type { ComponentChildren } from 'preact'

export declare function ContextMenu(props: {
  children?: ComponentChildren
  [key: string]: unknown
}): JSX.Element
export declare function ContextMenuItem(props: {
  children?: ComponentChildren
  onSelect?: () => void
  disabled?: boolean
  [key: string]: unknown
}): JSX.Element
