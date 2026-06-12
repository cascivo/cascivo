'use client'
import { cn } from '@cascade-ui/core'
import type { HTMLAttributes, ReactNode } from 'react'
import { Section } from '../../section/section'
import styles from './hero.module.css'

type HeadingLevel = 1 | 2 | 3

export interface HeroProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  variant?: 'centered' | 'split'
  /** Small mono line above the title. */
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  /** Buttons/links rendered in a row under the description. */
  actions?: ReactNode
  /** Right-hand slot in the split variant (image, demo, code). */
  media?: ReactNode
  headingLevel?: HeadingLevel
}

export function Hero({
  variant = 'centered',
  eyebrow,
  title,
  description,
  actions,
  media,
  headingLevel = 1,
  className,
  ...props
}: HeroProps) {
  const Heading = `h${headingLevel}` as const
  return (
    <Section className={cn(styles['hero'], className)} data-variant={variant} {...props}>
      <div className={styles['copy']}>
        {eyebrow && <p className={styles['eyebrow']}>{eyebrow}</p>}
        <Heading className={styles['title']}>{title}</Heading>
        {description && <p className={styles['description']}>{description}</p>}
        {actions && <div className={styles['actions']}>{actions}</div>}
      </div>
      {variant === 'split' && media && <div className={styles['media']}>{media}</div>}
    </Section>
  )
}
