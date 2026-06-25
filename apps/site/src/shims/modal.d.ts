import type { ComponentChildren } from 'preact'

export interface ModalProps {
  open?: boolean
  onClose?: () => void
  title?: string
  description?: string
  children?: ComponentChildren
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export declare function Modal(props: ModalProps): JSX.Element
