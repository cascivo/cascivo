import { Button, Flex, Heading, Text, Toggle } from '@cascivo/react'

const PREFERENCES = [
  { text: 'Product updates', on: true },
  { text: 'Weekly digest', on: false },
  { text: 'Security alerts', on: true },
]

export function Notifications() {
  return (
    <Flex gap={6}>
      <Flex gap={2}>
        <Heading level={1}>Notifications</Heading>
        <Text muted>Choose what we email you about.</Text>
      </Flex>
      <form onSubmit={(e) => e.preventDefault()}>
        <Flex gap={4}>
          {PREFERENCES.map((pref) => (
            <Flex key={pref.text} direction="horizontal" gap={2} align="center">
              <Toggle defaultChecked={pref.on} />
              <Text>{pref.text}</Text>
            </Flex>
          ))}
          <Button type="submit">Save preferences</Button>
        </Flex>
      </form>
    </Flex>
  )
}
