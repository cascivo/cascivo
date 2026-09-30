import { useSignals, useSignalEffect, useSignalState } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Badge, Button, CopyButton, EmptyState, SegmentedControl, Spinner } from '@cascivo/react'
import { BarChart, Kpi } from '@cascivo/charts'
import { BarChart3, Check, Eye, EyeOff, Monitor, RotateCcw, Tv, UserKey, X } from '@cascivo/icons'
import { buildPath } from '@cascivo/app'
import type { RouteProps } from '@cascivo/app'
import { PollComposer } from '../../../components/PollComposer'
import { QuestionCard } from '../../../components/QuestionCard'
import { NotFound, SessionGate, sessionFor } from '../../../components/SessionGate'
import { Shell } from '../../../components/Shell'
import { useRun } from '../../../components/useRun'
import { checkHost, moderate, setPoll, spotlight } from '../../../actions'
import { hostKey, rememberHost } from '../../../local'
import { byNewest, byVotes, pollTotal } from '../../../model'
import type { Poll, Question, QuestionState } from '../../../model'
import type { Session } from '../../../session'
import { router } from '../../../router'
import { msg } from '../../../i18n'
import styles from './host.module.css'

const HISTORY = 40
const SAMPLE_MS = 3000

function Stats({ session }: { session: Session }) {
  useSignals()
  // A short history of the room's size, sampled while this page is open, for the sparkline.
  const [history, setHistory] = useSignalState<number[]>([])
  useSignalEffect(() => {
    const sample = () => {
      setHistory((list) => [...list.slice(-(HISTORY - 1)), session.audience.peek()])
    }
    sample()
    const timer = setInterval(sample, SAMPLE_MS)
    return () => clearInterval(timer)
  })

  const questions = session.questions.value
  const upvotes = questions.reduce((sum, q) => sum + q.votes, 0)
  const pollVotes = session.polls.value.reduce((sum, p) => sum + pollTotal(p), 0)
  return (
    <div className={styles['stats']}>
      <Kpi
        label={t(msg.statPeople)}
        value={session.audience.value}
        {...(history.value.length > 1 ? { sparkline: history.value } : {})}
      />
      <Kpi label={t(msg.statQuestions)} value={questions.length} />
      <Kpi label={t(msg.statUpvotes)} value={upvotes} />
      <Kpi label={t(msg.statPollVotes)} value={pollVotes} />
    </div>
  )
}

function Moderation({ session }: { session: Session }) {
  useSignals()
  const run = useRun()
  const [filter, setFilter] = useSignalState<QuestionState>('open')
  const all = session.questions.value
  const count = (state: QuestionState) => all.filter((q) => q.state === state).length
  const list = all
    .filter((q) => q.state === filter.value)
    .sort(filter.value === 'open' ? byVotes : byNewest)
  const spot = session.spotlight.value
  const code = session.code

  const actions = (q: Question) => {
    const onStage = spot?.kind === 'question' && spot.id === q.id
    return (
      <>
        <Button
          size="sm"
          variant={onStage ? 'primary' : 'secondary'}
          onClick={() =>
            void run(() => spotlight(code, onStage ? null : { kind: 'question', id: q.id }))
          }
        >
          <Tv size={14} />
          {onStage ? t(msg.unspotlight) : t(msg.spotlight)}
        </Button>
        {q.state === 'open' ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void run(() => moderate(code, q.id, 'answered'))}
          >
            <Check size={14} />
            {t(msg.markAnswered)}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void run(() => moderate(code, q.id, 'open'))}
          >
            <RotateCcw size={14} />
            {t(msg.reopen)}
          </Button>
        )}
        {q.state !== 'hidden' ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void run(() => moderate(code, q.id, 'hidden'))}
          >
            <EyeOff size={14} />
            {t(msg.hide)}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void run(() => moderate(code, q.id, 'open'))}
          >
            <Eye size={14} />
            {t(msg.restore)}
          </Button>
        )}
      </>
    )
  }

  return (
    <section className={styles['panel']} aria-labelledby="moderation-title">
      <div className={styles['panelHead']}>
        <h2 id="moderation-title" className={styles['panelTitle']}>
          {t(msg.questionsTitle)}
        </h2>
        {spot ? (
          <Button size="sm" variant="ghost" onClick={() => void run(() => spotlight(code, null))}>
            <X size={14} />
            {t(msg.clearStage)}
          </Button>
        ) : null}
      </div>
      <SegmentedControl
        size="sm"
        ariaLabel={t(msg.filterLabel)}
        value={filter.value}
        onValueChange={(value) =>
          setFilter(value === 'answered' || value === 'hidden' ? value : 'open')
        }
        options={[
          { value: 'open', label: `${t(msg.filterOpen)} · ${count('open')}` },
          { value: 'answered', label: `${t(msg.filterAnswered)} · ${count('answered')}` },
          { value: 'hidden', label: `${t(msg.filterHidden)} · ${count('hidden')}` },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState title={t(msg.noQuestionsTitle)} description={t(msg.noQuestionsDescription)} />
      ) : (
        <div className={styles['list']}>
          {list.map((q) => (
            <QuestionCard
              key={q.id}
              code={code}
              question={q}
              onStage={spot?.kind === 'question' && spot.id === q.id}
              actions={actions(q)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function PollItem({ session, poll }: { session: Session; poll: Poll }) {
  useSignals()
  const run = useRun()
  const spot = session.spotlight.value
  const onStage = spot?.kind === 'poll' && spot.id === poll.id
  const started = poll.open || pollTotal(poll) > 0
  return (
    <article className={styles['poll']} data-open={poll.open || undefined}>
      <div className={styles['pollHead']}>
        {poll.open ? (
          <Badge variant="success">{t(msg.pollLive)}</Badge>
        ) : started ? (
          <Badge variant="secondary">{t(msg.pollClosed)}</Badge>
        ) : (
          <Badge variant="outline">{t(msg.draft)}</Badge>
        )}
        {onStage ? <Badge variant="default">{t(msg.onStage)}</Badge> : null}
        <span className={styles['pollVotes']}>{t(msg.pollVotes, { count: pollTotal(poll) })}</span>
      </div>
      <h3 className={styles['pollQuestion']}>{poll.question}</h3>
      {started ? (
        <BarChart
          title={poll.question}
          orientation="horizontal"
          height={Math.max(120, poll.options.length * 44)}
          series={[
            {
              id: 'votes',
              label: t(msg.statPollVotes),
              color: 'var(--cascivo-color-accent)',
              data: poll.options.map((label, i) => ({ label, votes: poll.counts[i] ?? 0 })),
            },
          ]}
          x={(d) => d.label}
          y={(d) => d.votes}
          labels
          tooltip
          fill="gradient"
          valueAxisTicks={3}
        />
      ) : (
        <ol className={styles['draftOptions']}>
          {poll.options.map((option, i) => (
            <li key={i}>{option}</li>
          ))}
        </ol>
      )}
      <div className={styles['pollActions']}>
        {poll.open ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void run(() => setPoll(session.code, poll.id, false))}
          >
            {t(msg.closePoll)}
          </Button>
        ) : (
          <Button size="sm" onClick={() => void run(() => setPoll(session.code, poll.id, true))}>
            <BarChart3 size={14} />
            {t(msg.launch)}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            void run(() => spotlight(session.code, onStage ? null : { kind: 'poll', id: poll.id }))
          }
        >
          <Tv size={14} />
          {onStage ? t(msg.unspotlight) : t(msg.spotlight)}
        </Button>
      </div>
    </article>
  )
}

function Polls({ session }: { session: Session }) {
  useSignals()
  const polls = session.polls.value
  return (
    <section className={styles['panel']} aria-labelledby="polls-title">
      <div className={styles['panelHead']}>
        <h2 id="polls-title" className={styles['panelTitle']}>
          {t(msg.pollsTitle)}
        </h2>
      </div>
      <div className={styles['composer']}>
        <h3 className={styles['composerTitle']}>{t(msg.newPoll)}</h3>
        <PollComposer code={session.code} />
      </div>
      {polls.length === 0 ? (
        <EmptyState title={t(msg.noPollsTitle)} description={t(msg.noPollsDescription)} />
      ) : (
        polls.map((poll) => <PollItem key={poll.id} session={session} poll={poll} />)
      )}
    </section>
  )
}

function Console({ session }: { session: Session }) {
  useSignals()
  const Link = router.Link
  const origin = typeof location === 'undefined' ? '' : location.origin
  const joinUrl = `${origin}${buildPath('/s/:code', { code: session.code })}`
  const hostUrl = `${origin}${buildPath('/s/:code/host', { code: session.code })}#key=${hostKey(session.code) ?? ''}`
  return (
    <div className={styles['console']}>
      <div className={styles['top']}>
        <div className={styles['heading']}>
          <span className={styles['eyebrow']}>{t(msg.hostConsole)}</span>
          <h1 className={styles['title']}>{session.meta.value?.title}</h1>
        </div>
        <div className={styles['toolbar']}>
          <Button asChild>
            <Link href={buildPath('/s/:code/stage', { code: session.code })} target="_blank">
              <Monitor size={16} />
              {t(msg.openStage)}
            </Link>
          </Button>
          <span className={styles['copy']}>
            <CopyButton value={joinUrl} labels={{ copy: t(msg.copyJoinLink) }} />
            {/* The button already carries this as its name; the caption is for the eye. */}
            <span aria-hidden="true">{t(msg.copyJoinLink)}</span>
          </span>
          <span className={styles['copy']} title={t(msg.hostLinkHint)}>
            <CopyButton value={hostUrl} labels={{ copy: t(msg.copyHostLink) }} />
            <span aria-hidden="true">
              <UserKey size={14} /> {t(msg.copyHostLink)}
            </span>
          </span>
        </div>
      </div>
      <Stats session={session} />
      <div className={styles['columns']}>
        <Moderation session={session} />
        <Polls session={session} />
      </div>
    </div>
  )
}

/**
 * Checks the host key before showing the console. A key in the URL fragment (the "host
 * link") is adopted into this browser first, then removed from the address bar.
 */
function HostGate({ session }: { session: Session }) {
  useSignals()
  const [state, setState] = useSignalState<'checking' | 'ok' | 'denied'>('checking')
  const Link = router.Link

  useSignalEffect(() => {
    const code = session.code
    const fromLink = /^#key=([\w-]{32,256})$/.exec(location.hash)
    if (fromLink) {
      rememberHost({
        code,
        key: fromLink[1]!,
        title: session.meta.peek()?.title ?? code,
        at: Date.now(),
      })
      history.replaceState(null, '', location.pathname)
    }
    let live = true
    void checkHost(code).then((ok) => {
      if (live) setState(ok ? 'ok' : 'denied')
    })
    return () => {
      live = false
    }
  })

  if (state.value === 'checking') {
    return (
      <div className={styles['center']}>
        <Spinner label={t(msg.connecting)} />
      </div>
    )
  }
  if (state.value === 'denied') {
    return (
      <div className={styles['center']}>
        <EmptyState
          size="lg"
          icon={<UserKey size={32} />}
          title={t(msg.notHostTitle)}
          description={t(msg.notHostDescription)}
          action={
            <Button asChild variant="secondary">
              <Link href={buildPath('/s/:code', { code: session.code })}>
                {t(msg.joinAsAudience)}
              </Link>
            </Button>
          }
        />
      </div>
    )
  }
  return <Console session={session} />
}

export default function HostPage({ params }: RouteProps<'/s/:code/host'>) {
  const session = sessionFor(params.code, 'host')
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
        <HostGate session={session} />
      </SessionGate>
    </Shell>
  )
}
