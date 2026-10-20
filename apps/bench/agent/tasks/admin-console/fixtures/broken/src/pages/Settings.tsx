import { Button, Card, CardContent, Flex, Heading, Input, Toggle } from '@cascivo/react'

export function Settings() {
  return (
    <Flex gap={6}>
      <Heading level={1}>Settings</Heading>
      <Card>
        <CardContent>
          <form onSubmit={(e) => e.preventDefault()}>
            <Flex gap={4}>
              <Input label="Workspace name" defaultValue="Acme" />
              <Toggle label="Email alerts" defaultChecked />
              <Button type="submit">Save</Button>
            </Flex>
          </form>
        </CardContent>
      </Card>
    </Flex>
  )
}
