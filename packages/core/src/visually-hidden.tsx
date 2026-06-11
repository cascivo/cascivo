import type { ReactNode, HTMLAttributes } from 'react'
import styles from './visually-hidden.module.css'

export interface VisuallyHiddenProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  showOnFocus?: boolean
}

export function VisuallyHidden({
  children,
  showOnFocus,
  className,
  ...props
}: VisuallyHiddenProps) {
  const classes = [styles.root, showOnFocus && styles.focusable, className]
    .filter(Boolean)
    .join(' ')
  return (
    <span className={classes} {...props}>
      {children}
    </span>
  )
}
