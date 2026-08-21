import { cn } from '@cascivo/core/pure'
import type { HTMLAttributes, LiHTMLAttributes } from 'react'
import styles from './list.module.css'

export interface ListProps extends HTMLAttributes<HTMLElement> {
  /**
   * `ul` for an unordered list, `ol` for a numbered one. Changes the element and its marker,
   * not the styling.
   *
   * @defaultValue `ul`
   * @see the component manifest
   */
  as?: 'ul' | 'ol'
  marker?: 'disc' | 'decimal' | 'none'
}

export function List({ as: Component = 'ul', marker, className, children, ...props }: ListProps) {
  return (
    <Component
      data-marker={marker ?? (Component === 'ol' ? 'decimal' : 'disc')}
      className={cn(styles['list'], className as string | undefined)}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </Component>
  )
}

export type ListItemProps = LiHTMLAttributes<HTMLLIElement>

export function ListItem({ className, children, ...props }: ListItemProps) {
  return (
    <li className={cn(styles['item'], className as string | undefined)} {...props}>
      {children}
    </li>
  )
}
