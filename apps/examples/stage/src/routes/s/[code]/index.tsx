import { useSignals, useSignalState } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { EmptyState, SegmentedControl } from '@cascivo/react'
import { MessageSquare } from '@cascivo/icons'
import type { RouteProps } from '@cascivo/app'
import { AskForm } from '../../../components/AskForm'
import { PollVote } from '../../../components/PollVote'
import { QuestionCard } from '../../../components/QuestionCard'
import { FloatingReactions, ReactionBar } from '../../../components/Reactions'
import { NotFound, SessionGate, sessionFor } from '../../../components/SessionGate'
import { Shell } from '../../../components/Shell'
import { sortQuestions } from '../../../session'
import type { Session } from '../../../session'
import { msg } from '../../../i18n'
import styles from './session.module.css'

function Questions({ session }: { session: Session }) {
  useSignals()
  const [order, setOrder] = useSignalState<'top' | 'new'>('top')
  const visible = session.questions.value.filter((q) => q.state !== 'hidden')
  const open = sortQuestions(
    visible.filter((q) => q.state === 'open'),
    order.value,
  )
  const answered = sortQuestions(
    visible.filter((q) => q.state === 'answered'),
    'new',
  )
  const spot = session.spotlight.value
  const onStage = (id: string) => spot?.kind === 'question' && spot.id === id

  return (
    <section className={styles['questions']} aria-labelledby="questions-title">
      <div className={styles['sectionHead']}>
        <h2 id="questions-title" className={styles['sectionTitle']}>
          {t(msg.questionsTitle)}
          <span className={styles['count']}>{visible.length}</span>
        </h2>
        <SegmentedControl
          size="sm"
          ariaLabel={t(msg.sortLabel)}
          value={order.value}
          onValueChange={(value) => setOrder(value === 'new' ? 'new' : 'top')}
          options={[
            { value: 'top', label: t(msg.sortTop) },
            { value: 'new', label: t(msg.sortNew) },
          ]}
        />
      </div>
      {visible.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={28} />}
          title={t(msg.noQuestionsTitle)}
          description={t(msg.noQuestionsDescription)}
        />
      ) : null}
      <div className={styles['list']}>
        {open.map((q) => (
          <QuestionCard key={q.id} code={session.code} question={q} onStage={onStage(q.id)} />
        ))}
      </div>
      {answered.length > 0 ? (
        <>
          <h3 className={styles['subTitle']}>{t(msg.answeredSection)}</h3>
          <div className={styles['list']}>
            {answered.map((q) => (
              <QuestionCard key={q.id} code={session.code} question={q} onStage={onStage(q.id)} />
            ))}
          </div>
        </>
      ) : null}
    </section>
  )
}

function Audience({ session }: { session: Session }) {
  useSignals()
  const poll = session.currentPoll.value
  return (
    <div className={styles['audience']}>
      <h1 className={styles['title']}>{session.meta.value?.title}</h1>
      {poll ? <PollVote key={poll.id} code={session.code} poll={poll} /> : null}
      <div className={styles['ask']}>
        <AskForm code={session.code} />
      </div>
      <Questions session={session} />
      <ReactionBar session={session} />
      <FloatingReactions session={session} />
    </div>
  )
}

export default function AudiencePage({ params }: RouteProps<'/s/:code'>) {
  const session = sessionFor(params.code, 'audience')
  if (!session) {
    return (
      <Shell>
        <NotFound />
      </Shell>
    )
  }
  return (
    <Shell session={session}>
      <SessionGate session={session}>
        <Audience session={session} />
      </SessionGate>
    </Shell>
  )
}
