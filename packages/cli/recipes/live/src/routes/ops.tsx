import { Kpi, LineChart } from '@cascivo/charts'
import { createClient } from '@cascivo/app/api'
import { watchLive } from '@cascivo/app/live'
import type { LiveEvent, LivePoint } from '@cascivo/app/live'
import {
  Badge,
  Card,
  CardContent,
  Flex,
  Grid,
  Heading,
  Text,
  Toggle,
  computed,
  signal,
  useSignalEffect,
  useSignals,
} from '@cascivo/react'
import { api } from '../api'
import { ops } from '../ops'

type Metric = (typeof ops.metrics)[number]

const client = createClient(api)
// One connection for the app's lifetime. The room sends the whole window when it opens, so a
// reload or a dropped connection comes back with the last two minutes.
const live = watchLive(ops, '/api/live')
const lastMinute = computed(() => live.points.value.slice(-60))
const total = (points: LivePoint<Metric>[], metric: Metric) =>
  points.reduce((sum, point) => sum + point.values[metric], 0)

const simulating = signal(true)

/** Stand-in traffic: a few orders every half second, some of them failing. */
function sendTraffic(): void {
  const events: LiveEvent<Metric>[] = Array.from(
    { length: 1 + Math.floor(Math.random() * 6) },
    () =>
      Math.random() < 0.05
        ? { values: { errors: 1 } }
        : { values: { orders: 1, revenue: Math.round(20 + Math.random() * 180) } },
  )
  client
    .sendEvents({ body: events })
    .catch((error: unknown) => console.warn('Could not send events', error))
}

export default function Ops() {
  useSignals()
  useSignalEffect(() => {
    if (!simulating.value) return
    const timer = setInterval(sendTraffic, 500)
    return () => clearInterval(timer)
  })
  const points = live.points.value
  const minute = lastMinute.value

  return (
    <Flex gap={4}>
      <Flex direction="horizontal" align="center" justify="between" wrap gap={3}>
        <Flex gap={1}>
          <Heading level={1}>Ops</Heading>
          <Text muted>
            Events go through a Queue into a Durable Object, which sends each second to every open
            dashboard.
          </Text>
        </Flex>
        <Flex direction="horizontal" align="center" gap={3}>
          <Badge variant={live.connection.value === 'open' ? 'success' : 'warning'}>
            {live.connection.value === 'open' ? 'Live' : 'Reconnecting'}
          </Badge>
          <Toggle
            label="Send simulated traffic"
            checked={simulating.value}
            onValueChange={(on) => {
              simulating.value = on
            }}
          />
        </Flex>
      </Flex>
      <Grid cols={3} gap={3}>
        <Kpi
          label="Orders, last minute"
          value={total(minute, 'orders').toLocaleString()}
          sparkline={minute.map((p) => p.values.orders)}
        />
        <Kpi
          label="Revenue, last minute"
          value={`$${total(minute, 'revenue').toLocaleString()}`}
          sparkline={minute.map((p) => p.values.revenue)}
        />
        <Kpi
          label="Errors, last minute"
          value={total(minute, 'errors').toLocaleString()}
          sparkline={minute.map((p) => p.values.errors)}
        />
      </Grid>
      <Card>
        <CardContent>
          <LineChart
            title="Orders and errors per second"
            series={[
              { id: 'orders', label: 'Orders', data: points, y: (p) => p.values.orders },
              { id: 'errors', label: 'Errors', data: points, y: (p) => p.values.errors },
            ]}
            x={(p) => new Date(p.at)}
            y={(p) => p.values.orders}
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <LineChart
            title="Revenue per second"
            series={[{ id: 'revenue', label: 'Revenue', data: points }]}
            x={(p) => new Date(p.at)}
            y={(p) => p.values.revenue}
          />
        </CardContent>
      </Card>
    </Flex>
  )
}
