import { Button, Flex, Heading, Text, Toggle } from '@cascivo/react'

export function Notifications() {
  return (
    <Flex gap={6}>
      <Flex gap={2}>
        <Heading level={1}>Notifications</Heading>
        <Text muted>Choose what we email you about.</Text>
      </Flex>
      <form onSubmit={(e) => e.preventDefault()}>
        <Flex gap={4}>
          <Toggle label="Product updates" defaultChecked />
          <Toggle label="Weekly digest" />
          <Toggle label="Security alerts" defaultChecked />
          <Button type="submit">Save preferences</Button>
        </Flex>
      </form>
    </Flex>
  )
}
