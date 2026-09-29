import type { PointerEvent } from 'react'
import { Badge, Button, Card, CardContent, Flex, Heading, Text, Textarea, useSignals } from '@cascivo/react'
import { addNote, notes, parseCursor, room, roomName } from '../board'
import type { Note } from '../board'
import styles from '../board.module.css'

let frame = 0

/** Shares this pointer's position on the board, at most once per frame. */
function trackCursor(event: PointerEvent<HTMLDivElement>) {
  const rect = event.currentTarget.getBoundingClientRect()
  const cursor = { x: Math.round(event.clientX - rect.left), y: Math.round(event.clientY - rect.top) }
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(() => room.setPresence(cursor))
}

/** Drags a note by its handle; every move is a write the whole room sees. */
function startDrag(event: PointerEvent<HTMLDivElement>, id: string, note: Note) {
  if ((event.target as Element).closest('button')) return
  const handle = event.currentTarget
  handle.setPointerCapture(event.pointerId)
  const dx = event.clientX - note.x
  const dy = event.clientY - note.y
  const move = (e: globalThis.PointerEvent) => {
    const current = notes.value[id]
    if (current) notes.set(id, { ...current, x: Math.max(0, e.clientX - dx), y: Math.max(0, e.clientY - dy) })
  }
  const up = () => {
    handle.removeEventListener('pointermove', move)
    handle.removeEventListener('pointerup', up)
  }
  handle.addEventListener('pointermove', move)
  handle.addEventListener('pointerup', up)
}

function NoteCard({ id, note }: { id: string; note: Note }) {
  return (
    <div className={styles['note']} style={{ transform: `translate(${note.x}px, ${note.y}px)` }}>
      <Card>
        <div className={styles['handle']} onPointerDown={(event) => startDrag(event, id, note)}>
          <Text size="sm" muted>
            Drag
          </Text>
          <Button size="sm" variant="ghost" aria-label="Delete note" onClick={() => notes.delete(id)}>
            ×
          </Button>
        </div>
        <CardContent>
          <Textarea
            aria-label="Note text"
            rows={3}
            value={note.text}
            onChange={(event) => notes.set(id, { ...note, text: event.target.value })}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default function Board() {
  useSignals()
  const connected = room.status.value === 'open'
  const others = Object.entries(room.presence.value).flatMap(([id, raw]) => {
    const cursor = parseCursor(raw)
    return cursor ? [{ id, ...cursor }] : []
  })

  return (
    <Flex gap={4}>
      <Flex direction="horizontal" align="center" justify="between" wrap gap={3}>
        <Flex gap={1}>
          <Heading level={1}>Board</Heading>
          <Text muted>
            Room <code>{roomName}</code>. Open this page in a second window: notes, edits and
            cursors sync live through a Durable Object.
          </Text>
        </Flex>
        <Flex direction="horizontal" align="center" gap={2}>
          <Badge variant={connected ? 'success' : 'neutral'}>
            {connected ? `${Object.keys(room.presence.value).length + 1} here` : 'Connecting…'}
          </Badge>
          <Button onClick={addNote}>Add note</Button>
        </Flex>
      </Flex>
      <div
        className={styles['board']}
        onPointerMove={trackCursor}
        onPointerLeave={() => room.setPresence(null)}
      >
        {Object.entries(notes.value).map(([id, note]) => (
          <NoteCard key={id} id={id} note={note} />
        ))}
        {others.map((cursor) => (
          <span
            key={cursor.id}
            className={styles['cursor']}
            style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
            aria-hidden="true"
          />
        ))}
      </div>
    </Flex>
  )
}
