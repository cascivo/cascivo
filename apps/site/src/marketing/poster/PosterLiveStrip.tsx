import { useRef } from 'react'
import type { PointerEvent } from 'react'
import { connectRoom } from '@cascivo/app/sync'
import type { Room } from '@cascivo/app/sync'
import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'

type Cursor = { x: number; y: number }

/** How often this page sends its pointer: ten times a second; the room allows twenty. */
const SEND_EVERY_MS = 100

/** Another visitor's pointer, from the room. Anything that is not two fractions is ignored. */
function parseCursor(raw: unknown): Cursor | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { x, y } = raw as Record<string, unknown>
  return typeof x === 'number' && typeof y === 'number' && x >= 0 && x <= 1 && y >= 0 && y <= 1
    ? { x, y }
    : null
}

/** One of the theme's eight chart colours, the same for a visitor on every screen. */
function colorOf(id: string): string {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return `var(--cascivo-chart-${(Math.abs(hash) % 8) + 1})`
}

function fractionIn(event: PointerEvent<HTMLDivElement>): Cursor {
  const rect = event.currentTarget.getBoundingClientRect()
  const clamp = (value: number) => Math.min(1, Math.max(0, value))
  return {
    x: clamp((event.clientX - rect.left) / rect.width),
    y: clamp((event.clientY - rect.top) / rect.height),
  }
}

/**
 * The live strip: everyone on this page right now, as pointers over one box. It is a real
 * `@cascivo/app/sync` room on a Durable Object (apps/live), and it renders only when the site
 * was built with that Worker's URL, so it never shows a room that is not there.
 */
export function PosterLiveStrip({ url }: { url: string }) {
  useSignals()
  const room = useSignal<Room | null>(null)
  const pending = useRef<Cursor | null>(null)
  const timer = useRef(0)

  useSignalEffect(() => {
    const joined = connectRoom(url)
    room.value = joined
    return () => {
      window.clearTimeout(timer.current)
      joined.close()
    }
  })

  const share = (cursor: Cursor | null) => {
    pending.current = cursor
    if (timer.current) return
    timer.current = window.setTimeout(() => {
      timer.current = 0
      room.value?.setPresence(pending.current)
    }, SEND_EVERY_MS)
  }

  const joined = room.value
  const status = joined?.status.value ?? 'connecting'
  const others = joined ? Object.entries(joined.presence.value) : []
  const cursors = others.flatMap(([id, raw]) => {
    const cursor = parseCursor(raw)
    return cursor ? [{ id, ...cursor }] : []
  })

  return (
    <div className="pg-pad pg-live" data-status={status}>
      <div className="pg-live-head">
        <p className="pg-eyebrow">
          <span className="pg-live-dot" aria-hidden="true" /> Live, right now
        </p>
        <p className="pg-live-count">
          {status === 'open'
            ? others.length === 0
              ? 'Only you are here. Open this page in a second window.'
              : `You and ${others.length} ${others.length === 1 ? 'other person are' : 'others are'} on this page.`
            : status === 'connecting'
              ? 'Joining the live room…'
              : 'The live room is out of reach. Retrying.'}
        </p>
      </div>
      {/* A pointer toy with nothing to read: the count above is the accessible part. */}
      <div
        className="pg-live-field"
        aria-hidden="true"
        onPointerMove={(event) => share(fractionIn(event))}
        onPointerDown={(event) => share(fractionIn(event))}
        onPointerLeave={() => share(null)}
      >
        <span className="pg-live-hint">Move your pointer here. Everyone on this page sees it.</span>
        {cursors.map((cursor) => (
          <span
            key={cursor.id}
            className="pg-live-cursor"
            style={{
              left: `${cursor.x * 100}%`,
              top: `${cursor.y * 100}%`,
              color: colorOf(cursor.id),
            }}
          />
        ))}
      </div>
      <p className="pg-note">
        A Durable Object on Cloudflare relays each pointer over one WebSocket, with the same{' '}
        <code>@cascivo/app/sync</code> rooms <code>--example board</code> scaffolds. Pointers are
        anonymous and shared only while inside the box.
      </p>
    </div>
  )
}
