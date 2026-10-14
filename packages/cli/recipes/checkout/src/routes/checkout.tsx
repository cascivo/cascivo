import { createClient } from '@cascivo/app/api'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Flex,
  Heading,
  Text,
  signal,
  useSignals,
} from '@cascivo/react'
import { api } from '../api'
import { PRODUCT, formatPrice } from '../checkout'

const client = createClient(api)
const starting = signal(false)
const failure = signal<string | null>(null)

/** Asks the Worker for a Stripe Checkout page and goes there: Stripe takes the card, not us. */
async function buy(): Promise<void> {
  starting.value = true
  failure.value = null
  try {
    const { url } = await client.startCheckout()
    location.assign(url)
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'Could not start the checkout'
    starting.value = false
  }
}

export default function Checkout() {
  useSignals()
  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Checkout</Heading>
        <Text muted>
          Paid on Stripe's hosted page. Stripe tells the Worker when the payment succeeds; the
          Worker records the order, updates its page and emails a receipt.
        </Text>
      </Flex>
      <Card>
        <CardContent>
          <Flex gap={3}>
            <Flex gap={1}>
              <Heading level={2}>{PRODUCT.name}</Heading>
              <Text muted>{PRODUCT.description}</Text>
            </Flex>
            <Text size="lg">{formatPrice(PRODUCT.amount, PRODUCT.currency)}</Text>
            <Flex direction="horizontal">
              <Button loading={starting.value} onClick={() => void buy()}>
                Buy now
              </Button>
            </Flex>
          </Flex>
        </CardContent>
      </Card>
      {failure.value ? (
        <Alert variant="destructive" title="The checkout did not start">
          {failure.value}
        </Alert>
      ) : null}
      <Text size="sm" muted>
        In test mode, pay with the card 4242 4242 4242 4242, any future date and any CVC.
      </Text>
    </Flex>
  )
}
