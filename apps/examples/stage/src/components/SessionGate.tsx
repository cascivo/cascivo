import type { ReactNode } from 'react'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Button, EmptyState, Skeleton } from '@cascivo/react'
import { Tv } from '@cascivo/icons'
import { isCode } from '../model'
import type { Role } from '../model'
import { getSession } from '../session'
import type { Session } from '../session'
import { router } from '../router'
import { msg } from '../i18n'
import styles from './SessionGate.module.css'

export function NotFound() {
  const Link = router.Link
  return (
    <div className={styles['center']}>
      <EmptyState
        size="lg"
        icon={<Tv size={32} />}
        title={t(msg.notFoundTitle)}
        description={t(msg.notFoundDescription)}
        action={
          <Button asChild variant="secondary">
            <Link href="/">{t(msg.backHome)}</Link>
          </Button>
        }
      />
    </div>
  )
}

function Loading() {
  return (
    <div className={styles['loading']} aria-busy="true" aria-label={t(msg.connecting)}>
      <Skeleton height="2.5rem" width="60%" />
      <Skeleton height="10rem" />
      <Skeleton height="5rem" />
      <Skeleton height="5rem" />
    </div>
  )
}

/** The session for a code from the URL, or `null` when it cannot be a code at all. */
export function sessionFor(code: string, role: Role): Session | null {
  const upper = code.toUpperCase()
  return isCode(upper) ? getSession(upper, role) : null
}

/**
 * Renders `children` once the room has answered: a skeleton until then, "not found" for a
 * code nobody started.
 */
export function SessionGate({ session, children }: { session: Session; children: ReactNode }) {
  useSignals()
  const found = session.found.value
  if (found === null) return <Loading />
  if (!found) return <NotFound />
  return <>{children}</>
}
