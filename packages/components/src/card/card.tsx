import { cn } from '@cascivo/core/pure'
import type { HTMLAttributes, ReactNode } from 'react'
import styles from './card.module.css'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Selects the visual style variant.
   *
   * @defaultValue `default`
   * @see the component manifest
   */
  variant?: 'default' | 'outlined' | 'elevated'
  /**
   * Inner padding of the CARD BOX. ⚠ `padding="none"` deliberately does NOT strip the
   * padding from CardHeader/CardContent/CardFooter — those keep their own. It means "let a
   * flush child (a LogViewer, an image, an edge-to-edge table) reach the card's edge";
   * zeroing both put the title flush against the border and made the mode unusable with the
   * composition it exists for. For an edge-to-edge table, skip CardContent and pass the
   * table as a direct child.
   *
   * @defaultValue `md`
   * @see the component manifest
   */
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({
  variant = 'default',
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      data-variant={variant}
      data-padding={padding}
      className={cn(styles['card'], className)}
      {...props}
    >
      {children}
    </div>
  )
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Trailing content pinned to the inline-end of the header — an overflow menu, a status
   * badge, a link. Without it the header is a column (title over description), which is
   * why `justify-content: space-between` alone does nothing: the most common dashboard
   * card layout is title-left / action-right, and it needs a row.
   *
   * The title column keeps `min-inline-size: 0`, so a long title truncates instead of
   * pushing the actions out of the card.
   */
  actions?: ReactNode
}

export function CardHeader({ actions, className, children, ...props }: CardHeaderProps) {
  if (actions === undefined) {
    return (
      <div className={cn(styles['header'], className)} {...props}>
        {children}
      </div>
    )
  }
  return (
    <div className={cn(styles['header'], styles['headerRow'], className)} {...props}>
      <div className={styles['headerMain']}>{children}</div>
      <div className={styles['headerActions']}>{actions}</div>
    </div>
  )
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3 className={cn(styles['title'], className)} {...props}>
      {children}
    </h3>
  )
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div className={cn(styles['content'], className)} {...props}>
      {children}
    </div>
  )
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div className={cn(styles['footer'], className)} {...props}>
      {children}
    </div>
  )
}
