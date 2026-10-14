import { createClient } from '@cascivo/app/api'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  Flex,
  Heading,
  Link,
  Spinner,
  Text,
  signal,
  useSignalEffect,
  useSignals,
} from '@cascivo/react'
import { api } from '../api'
import { auth } from '../auth'
import { PLAN } from '../billing'
import type { Billing, BillingStatus } from '../billing'
import { formatPrice } from '../checkout'
import { router } from '../router'

const client = createClient(api)
const billing = signal<Billing | null>(null)
const busy = signal<'subscribe' | 'portal' | null>(null)
const failure = signal<string | null>(null)

/**
 * Loads the plan. Back from Stripe's checkout, the URL carries the session id: syncing it
 * shows the new subscription at once, before the webhook. Then the id leaves the URL.
 */
async function load(): Promise<void> {
  failure.value = null
  try {
    const sessionId = new URLSearchParams(router.search.peek()).get('session')
    if (sessionId) {
      billing.value = await client.syncBilling({ body: { sessionId } })
      router.navigate('/billing', { replace: true })
    } else {
      billing.value = await client.getBilling()
    }
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'Could not load billing'
  }
}

/** Both buttons leave for a Stripe page: checkout, or the billing portal. */
async function leaveFor(kind: 'subscribe' | 'portal'): Promise<void> {
  busy.value = kind
  failure.value = null
  try {
    const { url } =
      kind === 'subscribe' ? await client.startSubscription() : await client.openBillingPortal()
    location.assign(url)
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'Stripe did not open'
    busy.value = null
  }
}

const LABEL: Record<BillingStatus, string> = {
  none: 'No plan',
  incomplete: 'Payment pending',
  incomplete_expired: 'Payment expired',
  trialing: 'Trial',
  active: 'Active',
  past_due: 'Payment failed: retrying',
  canceled: 'Cancelled',
  unpaid: 'Unpaid',
  paused: 'Paused',
}

export default function BillingPage() {
  useSignals()
  useSignalEffect(() => {
    if (auth.user.value) void load()
  })
  const user = auth.user.value
  const plan = billing.value

  if (user === undefined) return <Spinner label="Loading" />
  if (user === null) {
    return (
      <Flex gap={4}>
        <Heading level={1}>Billing</Heading>
        <Text>
          <Link href="/account">Sign in</Link> to subscribe: a plan belongs to your account.
        </Text>
      </Flex>
    )
  }
  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Billing</Heading>
        <Text muted>
          Paid on Stripe's hosted checkout; changed, paused or cancelled in Stripe's billing portal.
          The Worker keeps your plan in step through Stripe's webhook.
        </Text>
      </Flex>
      <Card>
        <CardContent>
          <Flex gap={3}>
            <Flex direction="horizontal" align="center" gap={2} wrap>
              <Heading level={2}>{PLAN.name}</Heading>
              {plan ? (
                <Badge variant={plan.active ? 'success' : 'secondary'}>{LABEL[plan.status]}</Badge>
              ) : null}
            </Flex>
            <Text muted>{PLAN.description}</Text>
            <Text size="lg">
              {formatPrice(PLAN.amount, PLAN.currency)} a {PLAN.interval}
            </Text>
            {plan?.currentPeriodEnd ? (
              <Text size="sm" muted>
                {plan.cancelAtPeriodEnd ? 'Ends' : 'Renews'} on{' '}
                {new Date(plan.currentPeriodEnd).toLocaleDateString()}
              </Text>
            ) : null}
            <Flex direction="horizontal" gap={2} wrap>
              {plan && !plan.active ? (
                <Button
                  loading={busy.value === 'subscribe'}
                  onClick={() => void leaveFor('subscribe')}
                >
                  Subscribe
                </Button>
              ) : null}
              {plan?.canManage ? (
                <Button
                  variant="secondary"
                  loading={busy.value === 'portal'}
                  onClick={() => void leaveFor('portal')}
                >
                  Manage billing
                </Button>
              ) : null}
            </Flex>
          </Flex>
        </CardContent>
      </Card>
      {failure.value ? (
        <Alert variant="destructive" title="Not done">
          {failure.value}
        </Alert>
      ) : null}
    </Flex>
  )
}
