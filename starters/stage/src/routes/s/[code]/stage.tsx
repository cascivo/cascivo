import { useSignals, useSignalEffect, useSignalState } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { IconButton, QrCode } from '@cascivo/react'
import { ArrowUp, Maximize, Minimize, Users } from '@cascivo/icons'
import { buildPath } from '@cascivo/app'
import type { RouteProps } from '@cascivo/app'
import { PollResults } from '../../../components/PollResults'
import { FloatingReactions } from '../../../components/Reactions'
import { NotFound, sessionFor } from '../../../components/SessionGate'
import { Brand } from '../../../components/Shell'
import { byVotes, pollTotal } from '../../../model'
import type { Poll, Question } from '../../../model'
import type { Session } from '../../../session'
import { msg } from '../../../i18n'
import styles from './stage.module.css'

function Spotlit({ question }: { question: Question }) {
  return (
    <figure className={styles['spotlit']}>
      <blockquote className={styles['quote']}>{question.text}</blockquote>
      <figcaption className={styles['by']}>
        <span>{question.author ?? t(msg.anonymous)}</span>
        <span className={styles['votes']}>
          <ArrowUp size={24} />
          {question.votes}
        </span>
      </figcaption>
    </figure>
  )
}

function PollStage({ poll }: { poll: Poll }) {
  return (
    <div className={styles['pollStage']}>
      <div className={styles['pollMeta']}>
        <span className={styles['pill']} data-open={poll.open || undefined}>
          {poll.open ? t(msg.pollLive) : t(msg.pollClosed)}
        </span>
        <span>{t(msg.pollVotes, { count: pollTotal(poll) })}</span>
      </div>
      <h1 className={styles['pollQuestion']}>{poll.question}</h1>
      <PollResults poll={poll} size="xl" />
    </div>
  )
}

function Idle({ questions }: { questions: Question[] }) {
  const top = questions
    .filter((q) => q.state === 'open')
    .sort(byVotes)
    .slice(0, 3)
  return (
    <div className={styles['idle']}>
      <h1 className={styles['idleTitle']}>{t(msg.stageIdleTitle)}</h1>
      <p className={styles['idleBody']}>{t(msg.stageIdleBody)}</p>
      {top.length > 0 ? (
        <div className={styles['leaderboard']}>
          <h2 className={styles['leaderTitle']}>{t(msg.stageTopQuestions)}</h2>
          <ol className={styles['leaders']}>
            {top.map((q, i) => (
              <li key={q.id} className={styles['leader']} style={{ animationDelay: `${i * 90}ms` }}>
                <span className={styles['leaderVotes']}>
                  <ArrowUp size={18} />
                  {q.votes}
                </span>
                <span className={styles['leaderText']}>{q.text}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  )
}

function Join({ session }: { session: Session }) {
  const origin = typeof location === 'undefined' ? '' : location.origin
  const path = buildPath('/s/:code', { code: session.code })
  const host = typeof location === 'undefined' ? '' : location.host
  return (
    <aside className={styles['join']}>
      <div className={styles['qr']}>
        <QrCode
          value={`${origin}${path}`}
          size={220}
          errorCorrection="M"
          fill="#16142a"
          background="#ffffff"
          label={`${t(msg.stageJoinAt)} ${host}${path}`}
        />
      </div>
      <div className={styles['joinText']}>
        <span className={styles['joinLabel']}>{t(msg.stageJoinAt)}</span>
        <span className={styles['joinUrl']}>
          {host}
          {path}
        </span>
      </div>
      <div className={styles['codeBlock']}>
        <span className={styles['joinLabel']}>{t(msg.stageCode)}</span>
        <span className={styles['bigCode']}>
          {[...session.code].map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </span>
      </div>
    </aside>
  )
}

function FullscreenToggle() {
  useSignals()
  const [full, setFull] = useSignalState(false)
  useSignalEffect(() => {
    const sync = () => setFull(document.fullscreenElement !== null)
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  })
  return (
    <IconButton
      label={full.value ? t(msg.exitFullscreen) : t(msg.enterFullscreen)}
      icon={full.value ? <Minimize size={18} /> : <Maximize size={18} />}
      onClick={() => {
        if (document.fullscreenElement) void document.exitFullscreen()
        else void document.documentElement.requestFullscreen()
      }}
    />
  )
}

function Stage({ session }: { session: Session }) {
  useSignals()
  const found = session.found.value
  const spot = session.spotlight.value
  const questions = session.questions.value
  const polls = session.polls.value
  const question = spot?.kind === 'question' ? questions.find((q) => q.id === spot.id) : undefined
  const poll = spot?.kind === 'poll' ? polls.find((p) => p.id === spot.id) : undefined
  const live = session.status.value === 'open'

  if (found === false) return <NotFound />

  return (
    <>
      <header className={styles['bar']}>
        <div className={styles['brandRow']}>
          <Brand size="lg" />
          <span className={styles['sessionTitle']}>{session.meta.value?.title}</span>
        </div>
        <div className={styles['barEnd']}>
          <span className={styles['people']} data-live={live || undefined}>
            <span className={styles['dot']} aria-hidden="true" />
            <Users size={20} />
            {t(msg.peopleHere, { count: session.audience.value })}
          </span>
          <FullscreenToggle />
        </div>
      </header>
      <main className={styles['main']}>
        {/* Keyed by what is on stage, so each change plays the entrance again. */}
        <section
          className={styles['spot']}
          key={spot ? `${spot.kind}:${spot.id}` : 'idle'}
          aria-live="polite"
        >
          {question ? <Spotlit question={question} /> : null}
          {poll ? <PollStage poll={poll} /> : null}
          {!question && !poll ? <Idle questions={questions} /> : null}
        </section>
        <Join session={session} />
      </main>
      <FloatingReactions session={session} size="xl" />
    </>
  )
}

export default function StagePage({ params }: RouteProps<'/s/:code/stage'>) {
  const session = sessionFor(params.code, 'stage')
  return (
    // The stage is always the dark, projector-friendly theme, whatever the app's theme is.
    <div className={styles['stage']} data-theme="midnight">
      <div className={styles['aurora']} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      {session ? <Stage session={session} /> : <NotFound />}
    </div>
  )
}
