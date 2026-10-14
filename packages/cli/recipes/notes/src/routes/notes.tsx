import {
  Badge,
  Button,
  Card,
  CardContent,
  Flex,
  Heading,
  Input,
  Text,
  Textarea,
  useSignals,
} from '@cascivo/react'
import { addNote, editNote, listName, notes, room } from '../notes'

/** Where the list stands: offline edits are counted until the room confirms them. */
function SyncBadge() {
  useSignals()
  const waiting = room.unsynced.value
  if (room.status.value === 'open') {
    return (
      <Badge variant={waiting > 0 ? 'warning' : 'success'}>
        {waiting > 0 ? 'Syncing…' : 'Synced'}
      </Badge>
    )
  }
  return <Badge variant="neutral">{waiting > 0 ? `Offline · ${waiting} waiting` : 'Offline'}</Badge>
}

export default function Notes() {
  useSignals()
  const sorted = Object.entries(notes.value).sort(([, a], [, b]) => b.updatedAt - a.updatedAt)

  return (
    <Flex gap={4}>
      <Flex direction="horizontal" align="center" justify="between" wrap gap={3}>
        <Flex gap={1}>
          <Heading level={1}>Notes</Heading>
          <Text muted>
            Keeps working offline: edits are saved on this device and sync when you are back. Open{' '}
            <code>/notes?list={listName}</code> on another device to share this list.
          </Text>
        </Flex>
        <Flex direction="horizontal" align="center" gap={2}>
          <SyncBadge />
          <Button onClick={addNote}>New note</Button>
        </Flex>
      </Flex>
      {sorted.length === 0 ? <Text muted>No notes yet.</Text> : null}
      {sorted.map(([id, note]) => (
        <Card key={id}>
          <CardContent>
            <Flex gap={2}>
              <Flex direction="horizontal" align="center" gap={2}>
                <Input
                  aria-label="Title"
                  placeholder="Title"
                  value={note.title}
                  onChange={(event) => editNote(id, note, { title: event.target.value })}
                />
                <Button variant="ghost" aria-label="Delete note" onClick={() => notes.delete(id)}>
                  ×
                </Button>
              </Flex>
              <Textarea
                aria-label="Note"
                rows={3}
                value={note.body}
                onChange={(event) => editNote(id, note, { body: event.target.value })}
              />
            </Flex>
          </CardContent>
        </Card>
      ))}
    </Flex>
  )
}
