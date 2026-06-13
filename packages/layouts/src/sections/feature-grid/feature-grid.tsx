'use client'
import { cn } from '@cascivo/core'
import type { HTMLAttributes, ReactNode } from 'react'
import { AutoGrid } from '../../auto-grid/auto-grid'
import { Section } from '../../section/section'
import styles from './feature-grid.module.css'

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export interface FeatureItem {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  href?: string
}

export interface FeatureGridProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode
  description?: ReactNode
  headingLevel?: Extract<HeadingLevel, 1 | 2 | 3>
  items: FeatureItem[]
  /** Minimum track width forwarded to AutoGrid. */
  min?: string
  className?: string | undefined
}

export function FeatureGrid({
  title,
  description,
  headingLevel = 2,
  items,
  min = '16rem',
  className,
  ...props
}: FeatureGridProps) {
  const SectionHeading = `h${headingLevel}` as const
  const itemHeadingLevel = Math.min(headingLevel + 1, 6) as HeadingLevel
  const ItemHeading = `h${itemHeadingLevel}` as const

  return (
    <Section className={cn(styles['feature-grid'], className)} {...props}>
      {(title || description) && (
        <div className={styles['header']}>
          {title && <SectionHeading className={styles['title']}>{title}</SectionHeading>}
          {description && <p className={styles['description']}>{description}</p>}
        </div>
      )}
      <AutoGrid min={min}>
        {items.map((item, i) => {
          const inner = (
            <>
              {item.icon && <span className={styles['icon']}>{item.icon}</span>}
              <ItemHeading className={styles['item-title']}>{item.title}</ItemHeading>
              {item.description && <p className={styles['item-description']}>{item.description}</p>}
            </>
          )
          return item.href ? (
            <a key={i} href={item.href} className={styles['item']}>
              {inner}
            </a>
          ) : (
            <div key={i} className={styles['item']}>
              {inner}
            </div>
          )
        })}
      </AutoGrid>
    </Section>
  )
}
