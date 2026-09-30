import { Flex, Heading, Text } from '@cascivo/react'
import { LiveCard } from '../LiveCard'

export default function Dashboard() {
  return (
    <Flex gap={6}>
      <Flex gap={2}>
        <Heading level={1}>Dashboard</Heading>
        <Text muted>
          Edit <code>src/routes/index.tsx</code> to build out this page.
        </Text>
      </Flex>
      <LiveCard />
    </Flex>
  )
}
