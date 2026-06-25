import type { ComponentChildren } from 'preact'

export declare function Menu(props: {
  children?: ComponentChildren
  [key: string]: unknown
}): JSX.Element
export declare function MenuTrigger(props: {
  children?: ComponentChildren
  [key: string]: unknown
}): JSX.Element
export declare function MenuItem(props: {
  children?: ComponentChildren
  onSelect?: () => void
  disabled?: boolean
  [key: string]: unknown
}): JSX.Element
export declare function MenuSeparator(): JSX.Element
