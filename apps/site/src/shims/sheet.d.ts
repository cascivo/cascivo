import type { ComponentChildren } from 'preact'

export declare function Sheet(props: {
  open: boolean
  onClose: () => void
  title?: string
  children?: ComponentChildren
  side?: 'start' | 'end' | 'top' | 'bottom'
  [key: string]: unknown
}): JSX.Element
