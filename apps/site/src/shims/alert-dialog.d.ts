import type { ComponentChildren } from 'preact'

export declare function AlertDialog(props: {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  title?: string
  description?: string
  children?: ComponentChildren
  [key: string]: unknown
}): JSX.Element
