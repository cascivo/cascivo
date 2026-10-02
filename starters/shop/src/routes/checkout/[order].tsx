import type { RouteProps } from '@cascivo/app'
import { createClient } from '@cascivo/app/api'
import { connectRoom } from '@cascivo/app/sync'
import {
  Alert,
  Badge,
  EmptyState,
  Flex,
  Heading,
  Link,
  Spinner,
  Text,
  signal,
  useEffectPropSignal,
  useSignalEffect,
  useSignals,
} from '@cascivo/react'
import { api } from '../../api'
import { PRODUCT, formatPrice, parseOrder } from '../../checkout'
import type { Order } from '../../checkout'

const client = createClient(api)
/** Orders seen, by id; `null` when the id has none. */
const orders = signal<Readonly<Record<string, Order | null>>>({})

/** Keeps the newest word on an order: a final status is never replaced by `pending`. */
function remember(id: string, order: Order | null): void {
  const known = orders.peek()[id]
  if (known && known.status !== 'pending' && order?.status === 'pending') return
  orders.value = { ...orders.peek(), [id]: order }
}

async function load(id: string): Promise<void> {
  try {
    remember(id, await client.getOrder({ params: { id } }))
  } catch {
    remember(id, null)
  }
}

/** Watches the order's room, where the Worker pushes what Stripe reports. Returns the cleanup. */
function watch(id: string): () => void {
  const room = connectRoom(`/api/orders/${id}/live`)
  const pushed = room.signal<Order | null>('order', null, (raw) =>
    raw === null ? null : parseOrder(raw),
  )
  const stop = pushed.signal.subscribe((order) => {
    if (order) remember(id, order)
  })
  return () => {
    stop()
    room.close()
  }
}

const STATUS = {
  pending: { variant: 'warning', label: 'Waiting for Stripe' },
  paid: { variant: 'success', label: 'Paid' },
  failed: { variant: 'destructive', label: 'Payment failed' },
  expired: { variant: 'secondary', label: 'Expired' },
} as const

/** `/checkout/:order` — where Stripe sends the buyer back. It updates when Stripe confirms. */
export default function OrderPage({ params }: RouteProps<'/checkout/:order'>) {
  useSignals()
  const id = useEffectPropSignal(params.order)
  useSignalEffect(() => {
    void load(id.value)
    return watch(id.value)
  })
  const order = orders.value[params.order]

  if (order === undefined) return <Spinner label="Loading" />
  if (order === null) {
    return <EmptyState title="No such order" description="Check the link in your receipt." />
  }
  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Your order</Heading>
        <Text muted>
          {PRODUCT.name} · {formatPrice(order.amount, order.currency)}
        </Text>
      </Flex>
      <Flex direction="horizontal" align="center" gap={2} wrap>
        <Badge variant={STATUS[order.status].variant}>{STATUS[order.status].label}</Badge>
        <Text size="sm" muted>
          Ordered {new Date(order.createdAt).toLocaleString()}
        </Text>
      </Flex>
      {order.status === 'pending' ? (
        <Alert variant="info" title="Confirming your payment">
          This page updates by itself when Stripe confirms. A bank payment can take a few days.
        </Alert>
      ) : null}
      {order.status === 'paid' ? (
        <Alert variant="success" title="Thank you">
          Your payment went through. A receipt is on its way to your inbox.
        </Alert>
      ) : null}
      {order.status === 'failed' ? (
        <Alert variant="destructive" title="The payment failed">
          Nothing was charged. <Link href="/checkout">Try again</Link>
        </Alert>
      ) : null}
      {order.status === 'expired' ? (
        <Alert variant="warning" title="This checkout expired">
          It was not paid in time. <Link href="/checkout">Start again</Link>
        </Alert>
      ) : null}
    </Flex>
  )
}
