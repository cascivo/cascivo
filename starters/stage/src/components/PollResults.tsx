import type { CSSProperties } from 'react'
import { t } from '@cascivo/i18n'
import { Check } from '@cascivo/icons'
import { pollShares, pollTotal } from '../model'
import type { Poll } from '../model'
import { msg } from '../i18n'
import styles from './PollResults.module.css'

/**
 * A poll's results as bars that grow as votes land. The bar width is a CSS variable, so a
 * new count animates by transition — no animation code, and none at all under
 * `prefers-reduced-motion`.
 */
export function PollResults({
  poll,
  mine = null,
  size = 'md',
}: {
  poll: Poll
  mine?: number | null
  size?: 'md' | 'xl'
}) {
  const shares = pollShares(poll)
  const top = Math.max(...poll.counts)
  const total = pollTotal(poll)
  return (
    <div className={styles['results']} data-size={size}>
      <ol className={styles['list']}>
        {poll.options.map((option, i) => {
          const share = shares[i] ?? 0
          const leading = total > 0 && poll.counts[i] === top
          return (
            <li
              key={i}
              className={styles['row']}
              data-leading={leading || undefined}
              data-mine={mine === i || undefined}
              style={{ '--share': `${share}%` } as CSSProperties}
            >
              <span className={styles['bar']} aria-hidden="true" />
              <span className={styles['label']}>
                {mine === i ? (
                  <span className={styles['mine']} title={t(msg.youVoted)}>
                    <Check size={size === 'xl' ? 28 : 14} />
                  </span>
                ) : null}
                {option}
              </span>
              <span className={styles['figure']}>
                <span className={styles['share']}>{share}%</span>
                <span className={styles['count']}>
                  {t(msg.pollVotes, { count: poll.counts[i] ?? 0 })}
                </span>
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
