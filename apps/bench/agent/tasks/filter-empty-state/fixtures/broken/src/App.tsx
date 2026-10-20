// BROKEN canary: removes the empty-state message. When no one matches, the list is simply empty;
// the Search box's own clear button still works. Everything else matches the cascivo canary.
import { Flex, Heading, List, ListItem, Search, Text, useSignalState } from '@cascivo/react'
import '@cascivo/themes/light.css'
import { MEMBERS } from './members'

export default function App() {
  const [query, setQuery] = useSignalState('')
  const needle = query.value.trim().toLowerCase()
  const matches = MEMBERS.filter(
    (m) => m.name.toLowerCase().includes(needle) || m.role.toLowerCase().includes(needle),
  )

  return (
    <main>
      <Flex gap={6}>
        <Heading level={1}>Team</Heading>
        <Search
          label="Filter members"
          placeholder="Filter by name or role"
          value={query.value}
          onValueChange={setQuery}
        />
        <List marker="none">
          {matches.map((m) => (
            <ListItem key={m.id}>
              <Text weight="semibold">{m.name}</Text>
              <Text muted>{m.role}</Text>
            </ListItem>
          ))}
        </List>
      </Flex>
    </main>
  )
}
