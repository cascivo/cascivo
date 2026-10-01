import { useSignals, useSignalState } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Button, Input, OtpInput, RelativeTime } from '@cascivo/react'
import { ArrowRight, BarChart3, ExternalLink, MessageSquare, Monitor, Tv } from '@cascivo/icons'
import { buildPath } from '@cascivo/app'
import { Brand, Shell } from '../components/Shell'
import { useRun } from '../components/useRun'
import { createSession } from '../actions'
import { hosted } from '../local'
import { CODE_LENGTH, isCode, LIMITS } from '../model'
import { router } from '../router'
import { msg } from '../i18n'
import styles from './home.module.css'

const DEPLOY_URL =
  'https://deploy.workers.cloudflare.com/?url=https://github.com/cascivo/cascivo/tree/main/starters/stage'

function JoinCard() {
  const [code, setCode] = useSignalState('')
  const valid = isCode(code.value)
  const go = (value: string) =>
    router.navigate(buildPath('/s/:code', { code: value.toUpperCase() }))
  return (
    <form
      className={styles['card']}
      onSubmit={(event) => {
        event.preventDefault()
        if (valid) go(code.value)
      }}
    >
      <div className={styles['cardHead']}>
        <span className={styles['cardIcon']} aria-hidden="true">
          <MessageSquare size={20} />
        </span>
        <div>
          <h2 className={styles['cardTitle']}>{t(msg.joinTitle)}</h2>
          <p className={styles['cardText']}>{t(msg.joinDescription)}</p>
        </div>
      </div>
      <div className={styles['otp']} role="group" aria-label={t(msg.joinCode)}>
        <OtpInput
          length={CODE_LENGTH}
          type="alphanumeric"
          value={code.value}
          onValueChange={(value) => {
            const next = value.toUpperCase()
            setCode(next)
            if (isCode(next)) go(next)
          }}
        />
      </div>
      <Button type="submit" variant="secondary" disabled={!valid}>
        {t(msg.join)}
        <ArrowRight size={16} />
      </Button>
    </form>
  )
}

function HostCard() {
  const [title, setTitle] = useSignalState('')
  const [busy, setBusy] = useSignalState(false)
  const run = useRun()
  const empty = title.value.trim().length === 0
  return (
    <form
      className={styles['card']}
      data-primary
      onSubmit={async (event) => {
        event.preventDefault()
        if (empty || busy.value) return
        setBusy(true)
        let code = ''
        const ok = await run(async () => {
          code = await createSession(title.value)
        })
        setBusy(false)
        if (ok) router.navigate(buildPath('/s/:code/host', { code }))
      }}
    >
      <div className={styles['cardHead']}>
        <span className={styles['cardIcon']} aria-hidden="true">
          <Tv size={20} />
        </span>
        <div>
          <h2 className={styles['cardTitle']}>{t(msg.hostTitle)}</h2>
          <p className={styles['cardText']}>{t(msg.hostDescription)}</p>
        </div>
      </div>
      <Input
        label={t(msg.sessionTitle)}
        placeholder={t(msg.sessionTitlePlaceholder)}
        value={title.value}
        maxLength={LIMITS.title}
        onChange={(event) => setTitle(event.currentTarget.value)}
      />
      <Button type="submit" loading={busy.value} disabled={empty}>
        {t(msg.startSession)}
        <ArrowRight size={16} />
      </Button>
    </form>
  )
}

function YourSessions() {
  useSignals()
  const list = hosted.value
  if (list.length === 0) return null
  const Link = router.Link
  return (
    <section className={styles['yours']} aria-labelledby="your-sessions">
      <div className={styles['sectionHead']}>
        <h2 id="your-sessions" className={styles['sectionTitle']}>
          {t(msg.yourSessions)}
        </h2>
        <p className={styles['cardText']}>{t(msg.yourSessionsHint)}</p>
      </div>
      <ul className={styles['sessionList']}>
        {list.map((s) => (
          <li key={s.code} className={styles['sessionItem']}>
            <div className={styles['sessionInfo']}>
              <span className={styles['sessionTitle']}>{s.title}</span>
              <span className={styles['sessionMeta']}>
                <span className={styles['codeChip']}>{s.code}</span>
                <RelativeTime date={s.at} />
              </span>
            </div>
            <div className={styles['sessionActions']}>
              <Button asChild variant="secondary" size="sm">
                <Link href={buildPath('/s/:code/host', { code: s.code })}>{t(msg.moderate)}</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href={buildPath('/s/:code/stage', { code: s.code })}>
                  <Monitor size={14} />
                  {t(msg.present)}
                </Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

const FEATURES = [
  { icon: <MessageSquare size={20} />, title: msg.featureAskTitle, body: msg.featureAskBody },
  { icon: <BarChart3 size={20} />, title: msg.featurePollTitle, body: msg.featurePollBody },
  { icon: <Monitor size={20} />, title: msg.featureStageTitle, body: msg.featureStageBody },
]

export default function Home() {
  return (
    <Shell>
      <section className={styles['hero']}>
        <span className={styles['eyebrow']}>{t(msg.heroEyebrow)}</span>
        <h1 className={styles['title']}>
          {t(msg.heroTitleStart)} <span className={styles['accent']}>{t(msg.heroTitleAccent)}</span>
        </h1>
        <p className={styles['lead']}>{t(msg.heroLead)}</p>
      </section>

      <div className={styles['cards']}>
        <HostCard />
        <JoinCard />
      </div>

      <YourSessions />

      <ul className={styles['features']}>
        {FEATURES.map((f) => (
          <li key={f.title.key} className={styles['feature']}>
            <span className={styles['featureIcon']} aria-hidden="true">
              {f.icon}
            </span>
            <h3 className={styles['featureTitle']}>{t(f.title)}</h3>
            <p className={styles['cardText']}>{t(f.body)}</p>
          </li>
        ))}
      </ul>

      <footer className={styles['footer']}>
        <Brand />
        <p className={styles['cardText']}>{t(msg.footerBuilt)}</p>
        <a className={styles['deploy']} href={DEPLOY_URL} target="_blank" rel="noreferrer">
          {t(msg.deployOwn)}
          <ExternalLink size={14} />
        </a>
      </footer>
    </Shell>
  )
}
