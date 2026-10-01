import type { ReactNode } from 'react'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Avatar, Badge, RelativeTime } from '@cascivo/react'
import { ArrowUp } from '@cascivo/icons'
import { hasUpvoted } from '../local'
import type { Question } from '../model'
import { upvote } from '../actions'
import { msg } from '../i18n'
import { useRun } from './useRun'
import styles from './QuestionCard.module.css'

function Upvote({ code, question }: { code: string; question: Question }) {
  useSignals()
  const run = useRun()
  const on = hasUpvoted(code, question.id)
  return (
    <button
      type="button"
      className={styles['vote']}
      aria-pressed={on}
      aria-label={`${on ? t(msg.removeUpvote) : t(msg.upvote)} — ${t(msg.votes, { count: question.votes })}`}
      onClick={() => void run(() => upvote(code, question.id, !on))}
    >
      <ArrowUp size={16} />
      <span className={styles['votes']}>{question.votes}</span>
    </button>
  )
}

/**
 * One question. The audience gets an upvote toggle; the host gets a static count and the
 * moderation `actions`.
 */
export function QuestionCard({
  code,
  question,
  onStage = false,
  actions,
}: {
  code: string
  question: Question
  onStage?: boolean
  actions?: ReactNode
}) {
  const author = question.author ?? t(msg.anonymous)
  return (
    <article
      className={styles['card']}
      data-on-stage={onStage || undefined}
      data-state={question.state}
    >
      {actions ? (
        <div className={styles['tally']}>
          <ArrowUp size={14} />
          <span className={styles['votes']}>{question.votes}</span>
        </div>
      ) : (
        <Upvote code={code} question={question} />
      )}
      <div className={styles['body']}>
        <p className={styles['text']}>{question.text}</p>
        <div className={styles['meta']}>
          <Avatar
            size="xs"
            {...(question.author ? { name: question.author } : { fallback: '?' })}
          />
          <span className={styles['author']}>{author}</span>
          <span aria-hidden="true">·</span>
          <RelativeTime date={question.at} />
          {onStage ? <Badge variant="default">{t(msg.onStage)}</Badge> : null}
          {question.state === 'answered' ? (
            <Badge variant="success">{t(msg.answered)}</Badge>
          ) : null}
          {question.state === 'hidden' ? <Badge variant="secondary">{t(msg.hidden)}</Badge> : null}
        </div>
        {actions ? <div className={styles['actions']}>{actions}</div> : null}
      </div>
    </article>
  )
}
