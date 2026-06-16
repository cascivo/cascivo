import styles from './chat-bubble.module.css'

export type ChatBubbleSide = 'start' | 'end'

export interface ChatBubbleProps {
  children: React.ReactNode
  side?: ChatBubbleSide
  avatar?: React.ReactNode
  name?: string
  time?: string
  className?: string
}

export function ChatBubble({
  children,
  side = 'start',
  avatar,
  name,
  time,
  className,
}: ChatBubbleProps) {
  return (
    <div className={[styles.bubble, className].filter(Boolean).join(' ')} data-side={side}>
      {avatar && (
        <div className={styles.avatar} aria-hidden="true">
          {avatar}
        </div>
      )}
      <div className={styles.content}>
        {(name || time) && (
          <div className={styles.meta}>
            {name && <span className={styles.name}>{name}</span>}
            {time && <time className={styles.time}>{time}</time>}
          </div>
        )}
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  )
}
