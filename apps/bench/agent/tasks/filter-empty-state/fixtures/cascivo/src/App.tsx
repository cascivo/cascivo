// Filter empty state canary (cascivo): team members filtered as you type with Search; when no one
// matches, an EmptyState says so and offers a button that clears the filter.
import {
  Button,
  EmptyState,
  Flex,
  Heading,
  List,
  ListItem,
  Search,
  Text,
  useSignalState,
} from '@cascivo/react'
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
        {matches.length > 0 ? (
          <List marker="none">
            {matches.map((m) => (
              <ListItem key={m.id}>
                <Text weight="semibold">{m.name}</Text>
                <Text muted>{m.role}</Text>
              </ListItem>
            ))}
          </List>
        ) : (
          <EmptyState
            title={`No members match “${query.value.trim()}”`}
            description="Try another name or role."
            action={<Button onClick={() => setQuery('')}>Clear filter</Button>}
          />
        )}
      </Flex>
    </main>
  )
}
