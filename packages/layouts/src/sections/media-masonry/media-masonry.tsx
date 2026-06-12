'use client'
import { cn } from '@cascade-ui/core'
import type { HTMLAttributes, ReactNode } from 'react'
import { Masonry } from '../../masonry/masonry'
import { Section } from '../../section/section'
import styles from './media-masonry.module.css'

type SpaceStep = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12

export interface MediaMasonryProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode
  description?: ReactNode
  headingLevel?: 1 | 2 | 3
  cols?: number
  gap?: SpaceStep
  children: ReactNode
  className?: string | undefined
}

export function MediaMasonry({
  title,
  description,
  headingLevel = 2,
  cols = 3,
  gap = 4,
  className,
  children,
  ...props
}: MediaMasonryProps) {
  const Heading = `h${headingLevel}` as const
  return (
    <Section width="wide" className={cn(styles['media-masonry'], className)} {...props}>
      {(title || description) && (
        <div className={styles['header']}>
          {title && <Heading className={styles['title']}>{title}</Heading>}
          {description && <p className={styles['description']}>{description}</p>}
        </div>
      )}
      <Masonry cols={cols} gap={gap}>
        {children}
      </Masonry>
    </Section>
  )
}
