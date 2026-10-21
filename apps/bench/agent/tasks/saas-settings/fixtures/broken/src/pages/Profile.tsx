import { Button, Flex, Heading, Input, Text } from '@cascivo/react'

export function Profile() {
  return (
    <Flex gap={6}>
      <Flex gap={2}>
        <Heading level={1}>Profile</Heading>
        <Text muted>How you appear to your teammates.</Text>
      </Flex>
      <form onSubmit={(e) => e.preventDefault()}>
        <Flex gap={4}>
          <Input label="Full name" defaultValue="Ada Lovelace" />
          <Input label="Email" type="email" defaultValue="ada@example.com" />
          <Button type="submit">Save profile</Button>
        </Flex>
      </form>
    </Flex>
  )
}
