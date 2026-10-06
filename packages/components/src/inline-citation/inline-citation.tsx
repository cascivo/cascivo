import { cn } from '@cascivo/core/pure'
import { builtin, t } from '@cascivo/i18n'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../hover-card/hover-card'
import { sourceHref } from '../sources/sources'
import type { AiSource } from '../sources/sources'
import { VisuallyHidden } from '../visually-hidden/visually-hidden'
import styles from './inline-citation.module.css'

export interface InlineCitationProps {
  index: number
  source: AiSource
  labels?: {
    source?: string
  }
  className?: string
}

export function InlineCitation({ index, source, labels, className }: InlineCitationProps) {
  const href = sourceHref(source.url)
  // The name starts with the visible number (WCAG 2.5.3) and carries the title, so the
  // citation makes sense without the hover card.
  const prefix =
    labels?.source?.replace('{index}', String(index)) ?? t(builtin.inlineCitation.source, { index })
  const name = `${prefix}: ${source.title}`

  const label = (
    <>
      <span aria-hidden="true">{index}</span>
      <VisuallyHidden>{name}</VisuallyHidden>
    </>
  )

  return (
    <sup className={cn(styles['citation'], className)}>
      <HoverCard>
        <HoverCardTrigger>
          {href ? (
            <a className={styles['marker']} href={href}>
              {label}
            </a>
          ) : (
            // A refused URL keeps the marker and its name, but is no longer a link.
            <span className={styles['marker']}>{label}</span>
          )}
        </HoverCardTrigger>
        <HoverCardContent className={cn(styles['card'])}>
          <span className={styles['title']}>{source.title}</span>
          {href ? <span className={styles['host']}>{new URL(href).hostname}</span> : null}
          {source.description ? (
            <span className={styles['description']}>{source.description}</span>
          ) : null}
        </HoverCardContent>
      </HoverCard>
    </sup>
  )
}
