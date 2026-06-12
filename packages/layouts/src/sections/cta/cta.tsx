'use client'
import { cn } from '@cascade-ui/core'
import type { HTMLAttributes, ReactNode } from 'react'
import { Section } from '../../section/section'
import styles from './cta.module.css'

type HeadingLevel = 1 | 2 | 3

export interface CtaProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title: ReactNode
  description?: ReactNode
  /** Buttons/links rendered in a row below the description. */
  actions?: ReactNode
  headingLevel?: HeadingLevel
  className?: string | undefined
}

export function Cta({
  title,
  description,
  actions,
  headingLevel = 2,
  className,
  ...props
}: CtaProps) {
  const Heading = `h${headingLevel}` as const
  return (
    <Section className={cn(styles['cta'], className)} {...props}>
      <Heading className={styles['title']}>{title}</Heading>
      {description && <p className={styles['description']}>{description}</p>}
      {actions && <div className={styles['actions']}>{actions}</div>}
    </Section>
  )
}
