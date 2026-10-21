// Filter empty state canary (shadcn): team member cards filtered as you type in a plain text input
// (no search role); when nothing matches, shadcn's Empty says so with a Reset button.
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { MEMBERS } from '@/members'

export function App() {
  const [filter, setFilter] = useState('')
  const needle = filter.trim().toLowerCase()
  const visible = MEMBERS.filter((m) => m.name.toLowerCase().includes(needle))

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Team members</h1>
      <Input
        aria-label="Filter by name"
        placeholder="Type a name…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      {visible.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Nothing matched your filter</EmptyTitle>
            <EmptyDescription>No team member is called “{filter.trim()}”.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => setFilter('')}>
              Reset filter
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {visible.map((m) => (
            <li key={m.id}>
              <Card>
                <CardHeader>
                  <CardTitle>{m.name}</CardTitle>
                  <CardDescription>{m.role}</CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default App
