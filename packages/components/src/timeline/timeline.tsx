import { cn, normalizeProgress, normalizeTone } from '@cascivo/core/pure'
import type { ProgressInput, ToneInput } from '@cascivo/core'
import type { HTMLAttributes, ReactNode } from 'react'
import styles from './timeline.module.css'

/** Canonical progress → the value Timeline's stylesheet keys on. */
const STATUS_CLASS: Record<string, string> = {
  pending: 'upcoming',
  active: 'current',
  complete: 'complete',
  error: 'error',
}

/** Canonical tone → the value Timeline's stylesheet keys on. */
const TONE_CLASS: Record<string, string> = {
  neutral: 'neutral',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
}

export interface TimelineItem {
  id: string
  title: ReactNode
  description?: ReactNode
  time?: string
  icon?: ReactNode
  /**
   * Where this entry sits in the sequence. Accepts the catalog-wide `Progress` vocabulary
   * (`pending | active | complete | error`) as well as Timeline's own `current` / `upcoming`
   * — they are aliases of `active` / `pending`, so one status enum drives both `Timeline`
   * and `Steps` with no translation.
   */
  status?: ProgressInput
  /**
   * What *kind* of entry this is, as a marker colour — independent of `status`, and
   * overriding it on the marker when set.
   *
   * `status` answers "where is this in the sequence", which is the right question for a
   * tracker (order placed → shipped → delivered). In an activity feed every entry is
   * equally done, and what separates them is what produced them: an automated alert, a
   * human note, a system event. Colouring those by progress renders them identically, so
   * the fastest signal on the page is thrown away. Takes the catalog-wide `Tone`
   * vocabulary (`neutral | info | success | warning | danger`, plus the `error` /
   * `destructive` / `default` aliases).
   *
   * Tone is not a substitute for text: it is not perceivable without colour vision, so
   * keep whatever the tone means also present in `title` or `description`.
   */
  tone?: ToneInput
}

export interface TimelineProps extends HTMLAttributes<HTMLOListElement> {
  items: TimelineItem[]
  /**
   * Layout orientation of the component.
   *
   * @defaultValue `vertical`
   * @see the component manifest
   */
  orientation?: 'vertical' | 'horizontal'
}

export function Timeline({ items, orientation = 'vertical', className, ...props }: TimelineProps) {
  return (
    <ol
      data-orientation={orientation}
      className={cn(styles['list'], className as string | undefined)}
      {...props}
    >
      {items.map((item) => {
        const progress = normalizeProgress(item.status ?? 'pending')
        return (
          <li
            key={item.id}
            data-status={STATUS_CLASS[progress] ?? 'upcoming'}
            data-tone={item.tone ? (TONE_CLASS[normalizeTone(item.tone)] ?? item.tone) : undefined}
            aria-current={progress === 'active' ? 'step' : undefined}
            className={styles['item']}
          >
            <span className={styles['marker']} aria-hidden="true">
              {/* A failed entry needs an affordance that survives without colour vision, so
                the error marker carries a glyph when the caller gave no icon — matching
                Steps' `✕`, which the shared Progress vocabulary already trained readers on. */}
              {item.icon ?? (progress === 'error' ? '✕' : null)}
            </span>
            <div className={styles['content']}>
              <div className={styles['title']}>{item.title}</div>
              {item.time ? <time className={styles['time']}>{item.time}</time> : null}
              {item.description ? (
                <div className={styles['description']}>{item.description}</div>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
