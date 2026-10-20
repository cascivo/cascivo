import { Button, Flex, Heading, Input, Select, Text } from '@cascivo/react'

const PLANS = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro — $12/month' },
  { value: 'team', label: 'Team — $49/month' },
]

export function Billing() {
  return (
    <Flex gap={6}>
      <Flex gap={2}>
        <Heading level={1}>Billing</Heading>
        <Text muted>Your plan and where invoices go.</Text>
      </Flex>
      <form onSubmit={(e) => e.preventDefault()}>
        <Flex gap={4}>
          <Select label="Plan" options={PLANS} defaultValue="pro" />
          <Input label="Billing email" type="email" defaultValue="billing@example.com" />
          <Button type="submit">Update billing</Button>
        </Flex>
      </form>
    </Flex>
  )
}
