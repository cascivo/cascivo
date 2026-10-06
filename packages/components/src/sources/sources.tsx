import { cn } from '@cascivo/core/pure'
import { builtin, t } from '@cascivo/i18n'
import type { HTMLAttributes, ReactNode } from 'react'
import styles from './sources.module.css'

export interface AiSource {
  title: string
  url: string
  description?: ReactNode
}

export interface SourcesProps extends HTMLAttributes<HTMLDetailsElement> {
  items: AiSource[]
  labels?: {
    summary?: string
  }
}

/**
 * The `href` to render for a source URL, or `undefined` when it must not be a link.
 *
 * Source URLs usually come straight from model output, so they are untrusted: only absolute
 * `http:` / `https:` URLs become links. Anything else — `javascript:`, `data:`, a relative
 * path, a malformed string — renders as plain text.
 */
export function sourceHref(url: string): string | undefined {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : undefined
  } catch {
    return undefined
  }
}

function hostname(href: string): string {
  return new URL(href).hostname.replace(/^www\./, '')
}

export function Sources({ items, labels, className, ...props }: SourcesProps) {
  const summary =
    labels?.summary?.replace('{count}', String(items.length)) ??
    t(builtin.sources.summary, { count: items.length })

  return (
    <details className={cn(styles['sources'], className as string | undefined)} {...props}>
      <summary className={styles['summary']}>
        {summary}
        <span className={styles['indicator']} aria-hidden="true" />
      </summary>
      <ol className={styles['list']}>
        {items.map((item, index) => {
          const href = sourceHref(item.url)
          return (
            // Numbered in order so an InlineCitation's number points at the same row.
            <li key={`${index}-${item.url}`} className={styles['item']}>
              {href ? (
                <a className={styles['title']} href={href}>
                  {item.title}
                </a>
              ) : (
                <span className={styles['title']}>{item.title}</span>
              )}
              {href ? <span className={styles['host']}>{hostname(href)}</span> : null}
              {item.description ? (
                <div className={styles['description']}>{item.description}</div>
              ) : null}
            </li>
          )
        })}
      </ol>
    </details>
  )
}
