import type { CSSProperties } from 'react'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { REACTIONS } from '../model'
import type { Reaction } from '../model'
import type { Session } from '../session'
import { msg } from '../i18n'
import styles from './Reactions.module.css'

export const EMOJI: Record<Reaction, string> = {
  heart: '❤️',
  clap: '👏',
  fire: '🔥',
  laugh: '😂',
  wow: '😮',
}

const LABEL = {
  heart: msg.reactionHeart,
  clap: msg.reactionClap,
  fire: msg.reactionFire,
  laugh: msg.reactionLaugh,
  wow: msg.reactionWow,
} as const

/** The audience's reaction buttons. Each tap floats up here and on the stage screen. */
export function ReactionBar({ session }: { session: Session }) {
  return (
    <div className={styles['bar']} role="group" aria-label={t(msg.react)}>
      {REACTIONS.map((reaction) => (
        <button
          key={reaction}
          type="button"
          className={styles['reaction']}
          aria-label={t(LABEL[reaction])}
          onClick={() => session.react(reaction)}
        >
          <span aria-hidden="true">{EMOJI[reaction]}</span>
        </button>
      ))}
    </div>
  )
}

/** Reactions rising through the viewport. Decorative, so hidden from assistive tech. */
export function FloatingReactions({
  session,
  size = 'md',
}: {
  session: Session
  size?: 'md' | 'xl'
}) {
  useSignals()
  return (
    <div className={styles['layer']} data-size={size} aria-hidden="true">
      {session.floating.value.map((f) => (
        <span
          key={f.id}
          className={styles['float']}
          style={{ '--x': f.x, '--sway': f.id % 2 ? 1 : -1 } as CSSProperties}
        >
          {EMOJI[f.e]}
        </span>
      ))}
    </div>
  )
}
