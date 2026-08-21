import { cn } from '@cascivo/core/pure'
import type { HTMLAttributes } from 'react'
import styles from './text.module.css'

export interface TextProps extends HTMLAttributes<HTMLElement> {
  /**
   * `p` for a paragraph, `span` for inline text, `div` for a block that imposes no semantics
   * of its own.
   *
   * @defaultValue `p`
   * @see the component manifest
   */
  as?: 'p' | 'span' | 'div'
  size?: 'sm' | 'md' | 'lg'
  weight?: 'normal' | 'medium' | 'semibold'
  /**
   * When true, renders in a muted/subtle color. `Text` has no `tone` prop: `tone` is the
   * severity vocabulary (Status, Badge, Timeline, SideNav); text emphasis is `muted`.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  muted?: boolean
}

export function Text({
  as: Component = 'p',
  size = 'md',
  weight = 'normal',
  muted = false,
  className,
  children,
  ...props
}: TextProps) {
  return (
    <Component
      data-size={size}
      data-weight={weight}
      data-muted={muted ? '' : undefined}
      className={cn(styles['text'], className as string | undefined)}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </Component>
  )
}
