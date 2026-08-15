import { cn } from '@cascivo/core/pure'
import type { CSSProperties, ReactNode } from 'react'
import styles from './large-title-header.module.css'

export interface LargeTitleHeaderProps {
  /** The page title. Rendered as the large heading and mirrored in the collapsed bar. */
  title: string
  /** Content of the scrolling region, rendered below the title. */
  children: ReactNode
  /** Leading slot of the compact bar — typically a back control. */
  leading?: ReactNode
  /** Trailing slot of the compact bar — typically icon buttons. */
  actions?: ReactNode
  /**
   * Heading level for the title, mapping to h1–h3.
   *
   * @defaultValue `1`
   * @see the component manifest
   */
  level?: 1 | 2 | 3
  /**
   * Scroll distance (px) over which the large title collapses into the bar.
   *
   * @defaultValue `48`
   * @see the component manifest
   */
  collapseDistance?: number
  className?: string
}

/**
 * Scrolling region with an iOS-style page header: the large title scrolls away and a
 * compact sticky bar reveals the same title in its place.
 *
 * The collapse is a CSS scroll-driven animation — no scroll listener, no
 * IntersectionObserver, no client JavaScript of any kind, so this renders complete from
 * the server and never hydrates. Where `animation-timeline` is unsupported the mirrored
 * title stays hidden and the region degrades to a plain sticky bar above a heading; the
 * heading itself is always present, so no content depends on the enhancement.
 *
 * The component owns the scroll container so the sticky bar and the scroll timeline
 * cannot be broken by the surrounding markup. Give it a parent with a resolved height.
 */
export function LargeTitleHeader({
  title,
  children,
  leading,
  actions,
  level = 1,
  collapseDistance = 48,
  className,
}: LargeTitleHeaderProps) {
  const Tag = `h${level}` as const
  const rootStyle = { '--_collapse': `${collapseDistance}px` } as CSSProperties
  return (
    <div className={cn(styles['root'], className)} style={rootStyle}>
      <div className={styles['bar']}>
        <div className={styles['slot']}>{leading}</div>
        {/* Visual mirror of the heading below — hidden from AT so the title is
            announced once, by the real heading. */}
        <span aria-hidden="true" className={styles['compactTitle']}>
          {title}
        </span>
        <div className={cn(styles['slot'], styles['slotEnd'])}>{actions}</div>
      </div>
      <Tag className={styles['largeTitle']}>{title}</Tag>
      {children}
    </div>
  )
}
