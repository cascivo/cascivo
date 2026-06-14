'use client'
import { signal, useSignalEffect, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { useRef } from 'react'
import { logs } from '../sim/metrics'
import { msg } from '../i18n'

// Track whether user has scrolled up — module-level signal
const userScrolled = signal(false)

const LEVEL_COLOR: Record<string, string> = {
  error: 'var(--cascivo-color-destructive)',
  warn: 'var(--cascivo-color-warning)',
  info: 'var(--cascivo-color-foreground-muted)',
}

const LEVEL_LABEL: Record<string, string> = {
  error: 'ERR',
  warn: 'WRN',
  info: 'INF',
}

export function Logs() {
  useSignals()
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Scroll event listener — track whether user scrolled away from bottom
  useSignalEffect(() => {
    const node = scrollRef.current
    if (!node) return
    const onScroll = () => {
      const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 8
      userScrolled.value = !atBottom
    }
    node.addEventListener('scroll', onScroll, { passive: true })
    return () => node.removeEventListener('scroll', onScroll)
  })

  // Auto-scroll to bottom on new log lines (only if user hasn't scrolled up)
  useSignalEffect(() => {
    void logs.value // subscribe
    if (userScrolled.value) return
    const node = scrollRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  })

  const lines = logs.value

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--cascivo-space-4)',
        padding: 'var(--cascivo-space-6)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2
          style={{
            fontSize: 'var(--cascivo-text-base)',
            fontWeight: 600,
            color: 'var(--cascivo-color-foreground)',
          }}
        >
          {t(msg.logsTitle)}
        </h2>
        <span
          style={{
            fontSize: 'var(--cascivo-text-xs)',
            color: 'var(--cascivo-color-foreground-muted)',
          }}
        >
          {lines.length} lines
        </span>
      </div>

      <div
        ref={scrollRef}
        style={{
          height: 'calc(100vh - 220px)',
          overflowY: 'auto',
          background: 'var(--cascivo-surface-subtle)',
          borderRadius: 'var(--cascivo-radius-md)',
          border: '1px solid var(--cascivo-color-border)',
          padding: 'var(--cascivo-space-3)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            fontFamily: 'var(--cascivo-font-mono, monospace)',
            fontSize: 'var(--cascivo-text-xs)',
          }}
        >
          {lines.map((line) => (
            <div
              key={line.id}
              style={{
                display: 'flex',
                gap: 'var(--cascivo-space-2)',
                lineHeight: '1.5',
              }}
            >
              <span style={{ color: 'var(--cascivo-color-foreground-muted)', flexShrink: 0 }}>
                {new Date(line.t).toLocaleTimeString()}
              </span>
              <span
                style={{
                  color: LEVEL_COLOR[line.level] ?? 'var(--cascivo-color-foreground-muted)',
                  fontWeight: 600,
                  flexShrink: 0,
                  width: '2.5rem',
                }}
              >
                {LEVEL_LABEL[line.level] ?? line.level.toUpperCase()}
              </span>
              <span style={{ color: 'var(--cascivo-color-foreground-muted)', flexShrink: 0 }}>
                {line.host}
              </span>
              <span style={{ color: 'var(--cascivo-color-foreground)' }}>{line.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
