import type { ReactNode } from 'react'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { IconButton, Status } from '@cascivo/react'
import { Moon, Sun } from '@cascivo/icons'
import { router } from '../router'
import { theme, toggleTheme } from '../local'
import type { Session } from '../session'
import { msg } from '../i18n'
import styles from './Shell.module.css'

export function Brand({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <span className={styles['brand']} data-size={size}>
      <span className={styles['mark']} aria-hidden="true">
        <span className={styles['beam']} />
      </span>
      <span className={styles['word']}>{t(msg.appName)}</span>
    </span>
  )
}

/** Whether the room is live, and how many people are in it. */
export function LiveBadge({ session }: { session: Session }) {
  useSignals()
  const status = session.status.value
  const label =
    status === 'open'
      ? t(msg.peopleHere, { count: session.audience.value })
      : status === 'connecting' && session.found.value === null
        ? t(msg.connecting)
        : t(msg.reconnecting)
  return (
    <span className={styles['live']} aria-live="polite">
      <Status status={status === 'open' ? 'success' : 'warning'} pulse={status === 'open'}>
        {label}
      </Status>
    </span>
  )
}

export function ThemeToggle() {
  useSignals()
  const light = theme.value === 'light'
  return (
    <IconButton
      label={light ? t(msg.themeToDark) : t(msg.themeToLight)}
      icon={light ? <Moon size={18} /> : <Sun size={18} />}
      onClick={toggleTheme}
    />
  )
}

export function Shell({
  session,
  actions,
  children,
}: {
  session?: Session
  actions?: ReactNode
  children: ReactNode
}) {
  useSignals()
  const title = session?.meta.value?.title
  const Link = router.Link
  return (
    <div className={styles['shell']}>
      <header className={styles['header']}>
        <Link href="/" className={styles['home']}>
          <Brand />
        </Link>
        {session && title ? (
          <div className={styles['session']}>
            <span className={styles['title']}>{title}</span>
            <span className={styles['code']}>{session.code}</span>
          </div>
        ) : (
          <span className={styles['spacer']} />
        )}
        <div className={styles['actions']}>
          {session ? <LiveBadge session={session} /> : null}
          {actions}
          <ThemeToggle />
        </div>
      </header>
      <main className={styles['main']}>{children}</main>
    </div>
  )
}
