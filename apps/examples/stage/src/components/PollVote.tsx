import { useSignals, useSignalState } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Badge } from '@cascivo/react'
import { BarChart3 } from '@cascivo/icons'
import { myVote } from '../local'
import { pollTotal } from '../model'
import type { Poll } from '../model'
import { vote } from '../actions'
import { msg } from '../i18n'
import { PollResults } from './PollResults'
import { useRun } from './useRun'
import styles from './PollVote.module.css'

/**
 * The poll as the audience sees it: the options to pick from, then the live results with
 * their own pick marked. While the poll is open the pick can change.
 */
export function PollVote({ code, poll }: { code: string; poll: Poll }) {
  useSignals()
  const run = useRun()
  const [pending, setPending] = useSignalState<number | null>(null)
  const mine = myVote(code, poll.id)
  const showResults = mine !== null || !poll.open

  const pick = async (option: number) => {
    setPending(option)
    await run(() => vote(code, poll.id, option))
    setPending(null)
  }

  return (
    <section className={styles['card']} aria-labelledby={`poll-${poll.id}`}>
      <div className={styles['head']}>
        <span className={styles['icon']} aria-hidden="true">
          <BarChart3 size={18} />
        </span>
        {poll.open ? (
          <Badge variant="default">{t(msg.pollLive)}</Badge>
        ) : (
          <Badge variant="secondary">{t(msg.pollClosed)}</Badge>
        )}
        <span className={styles['total']}>{t(msg.pollVotes, { count: pollTotal(poll) })}</span>
      </div>
      <h2 id={`poll-${poll.id}`} className={styles['question']}>
        {poll.question}
      </h2>
      {showResults ? (
        <PollResults poll={poll} mine={mine} />
      ) : (
        <div className={styles['options']}>
          {poll.options.map((option, i) => (
            <button
              key={i}
              type="button"
              className={styles['option']}
              disabled={pending.value !== null}
              data-pending={pending.value === i || undefined}
              onClick={() => void pick(i)}
            >
              <span className={styles['letter']} aria-hidden="true">
                {String.fromCharCode(65 + i)}
              </span>
              {option}
            </button>
          ))}
        </div>
      )}
      {poll.open && mine !== null ? (
        <div className={styles['change']}>
          <span>{t(msg.changeVoteHint)}</span>
          <div className={styles['chips']}>
            {poll.options.map((option, i) => (
              <button
                key={i}
                type="button"
                className={styles['chip']}
                aria-pressed={mine === i}
                disabled={pending.value !== null}
                onClick={() => void pick(i)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
