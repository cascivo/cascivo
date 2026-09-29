import { Card, CardContent, CardHeader, CardTitle, Flex, Heading, Text } from '@cascivo/react'

export default function Settings() {
  return (
    <Flex gap={6}>
      <Flex gap={2}>
        <Heading level={1}>Settings</Heading>
        <Text muted>
          Edit <code>src/routes/settings.tsx</code> to build out this page.
        </Text>
      </Flex>

      <Card>
        <CardHeader>
          <CardTitle>Get started</CardTitle>
        </CardHeader>
        <CardContent>
          <Text>
            This page is wired into the app shell. Add components with{' '}
            <code>npx cascivo add &lt;component&gt;</code>.
          </Text>
        </CardContent>
      </Card>
    </Flex>
  )
}
